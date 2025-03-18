import { app, BrowserWindow, clipboard, ipcMain, shell } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import express, { Response } from "express";
import morgan from "morgan";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import notifier from "node-notifier";
import { exec } from "node:child_process";
import { ClipDiscoveryService } from "./services/ClipDiscoveryService";
import { SettingsManager } from "./services/SettingsManagerService";
import {
  generateUrlScheme,
  getServerIp,
  isRedditUrl,
  isYoutubeUrl,
} from "./utils";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

const expressApp = express();
const port = Number(process.env.SERVER_PORT) || 5000;

// :: Express middleware
expressApp.use(express.json());
expressApp.use(express.urlencoded({ extended: true }));
expressApp.use(morgan("combined"));
expressApp.use(cors());

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    const filePath = path.join(app.getPath("userData"), "uploads");
    fs.mkdirSync(filePath, { recursive: true });
    callback(null, filePath);
  },
  filename: (req, file, callback) => {
    callback(null, file.originalname);
  },
});

const upload = multer({ storage });

// Long polling data
let pollingRequest: { res: Response } | null = null;
let currentSession: NodeJS.Timeout = null;
const TIMEOUT = 30000;

let mainWindow: BrowserWindow;

const discoveryService = new ClipDiscoveryService(port);
const settingsManager = new SettingsManager();

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }
};

function setupExpressRoutes() {
  expressApp.get("/api", (req, res) => {
    return res.status(200).json({
      success: true,
    });
  });

  // :: Get servers
  expressApp.get("/api/servers", (req, res) => {
    const servers = discoveryService.getActiveServers();
    return res.json({ servers });
  });

  // :: Receive text
  expressApp.post("/api/text", (req, res) => {
    const { content } = req.body;
    const deviceName = req.body.device_name ?? "Device";

    console.log(`Data received from ${deviceName}: ${req.body}`);

    // :: Write to clipboard
    clipboard.writeText(content);

    // :: Send notification
    notifier.notify({
      title: `New content from ${deviceName}`,
      message: `Content: ${content}`,
    });

    // :: Notify renderer process
    if (mainWindow) {
      mainWindow.webContents.send("text-received", { content, deviceName });
    }

    // :: Open URL if it's a link
    if (content.startsWith("https") || content.startsWith("http")) {
      console.log("Link detected, opening the url in your default browser!");
      shell.openExternal(content);
    }

    console.log("Notification sent!");
    return res.status(200).json({ success: true });
  });

  // :: Long polling
  expressApp.get("/api/poll", (req, res) => {
    pollingRequest = { res };

    currentSession = setTimeout(() => {
      if (currentSession) {
        currentSession = null;
        return res.status(400).json({ success: false });
      }
    }, TIMEOUT);
  });

  // :: Receive content for long polling
  expressApp.post("/api/content", (req, res) => {
    const { content } = req.body;
    let urlScheme = null;

    if (currentSession) {
      console.log("Payload received");
      console.log("Payload: ", content);

      if (isYoutubeUrl(content)) {
        urlScheme = generateUrlScheme(content, "youtube");
      } else if (isRedditUrl(content)) {
        urlScheme = generateUrlScheme(content, "reddit");
      }

      console.log("url scheme: ", urlScheme);
      clearTimeout(currentSession);
      currentSession = null;

      if (!content) pollingRequest.res.status(200).json({ success: false });
      pollingRequest.res
        .status(200)
        .json({ content, ...(urlScheme && { urlScheme }) });

      // :: Notify renderer process
      if (mainWindow) {
        mainWindow.webContents.send("content-received", { content, urlScheme });
      }

      return res.status(200).json({ success: true });
    }

    return res
      .status(400)
      .json({ success: false, message: "No current session found" });
  });

  // :: Receive image
  expressApp.post("/api/image", upload.single("file"), (req, res) => {
    const deviceName = req.body.device_name ?? "Device";

    if (req.file) {
      console.log(
        `File from ${deviceName} has been uploaded successfully: ${req.file}`
      );

      const imagePath = path.join(
        app.getPath("userData"),
        "uploads",
        req.file.originalname
      );
      console.log(imagePath);

      // :: Copy image to clipboard based on platform
      let command;
      switch (process.platform) {
        case "win32":
          // :: Use Electron's clipboard API for images
          try {
            const nativeImage =
              require("electron").nativeImage.createFromPath(imagePath);
            clipboard.writeImage(nativeImage);
            if (mainWindow) {
              mainWindow.webContents.send("image-received", {
                path: imagePath,
                deviceName,
              });
            }
            return res.status(200).json({ success: true });
          } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false });
          }
        case "darwin":
          command = `osascript -e 'tell application "Finder" to set the clipboard to ( POSIX file "${imagePath}" )'`;
          break;
        case "linux":
          command = `xclip -selection clipboard -t image/png -i ${imagePath}`;
          break;
        default:
          return res.status(500).send("Unsupported OS");
      }

      exec(command, (error) => {
        if (error) {
          console.error(error);
          return res.status(500).json({ success: false });
        }

        // Notify renderer process
        if (mainWindow) {
          mainWindow.webContents.send("image-received", {
            path: imagePath,
            deviceName,
          });
        }

        return res.status(200).json({ success: true });
      });
    } else {
      console.log(`No file from ${deviceName} uploaded`);
      res.status(400).json({ success: false });
    }
  });

  // :: Settings routes
  expressApp.patch("/api/settings", async (req, res) => {
    const { isDiscoverable } = req.body.settings;
    const result = await discoveryService.setDiscoverable(isDiscoverable);
    res.json({ success: true });
  });

  expressApp.get("/api/settings", (req, res) => {
    const settings = discoveryService.getSettings();
    res.json({ ...settings });
  });
}

// :: IPC handlers for renderer process communication
function setupIpcHandlers() {
  // :: Get active servers
  ipcMain.handle("get-servers", () => {
    return discoveryService.getActiveServers();
  });

  // :: Get settings
  ipcMain.handle("get-settings", () => {
    return discoveryService.getSettings();
  });

  // :: Update settings
  ipcMain.handle("update-settings", async (event, settings) => {
    const { isDiscoverable } = settings;
    return await discoveryService.setDiscoverable(isDiscoverable);
  });

  // :: Copy text to clipboard
  ipcMain.handle("copy-to-clipboard", (event, text) => {
    clipboard.writeText(text);
    return true;
  });
}

app.on("ready", () => {
  createWindow();
  setupExpressRoutes();
  setupIpcHandlers();

  expressApp.listen(port, () => {
    const ipAddress = getServerIp();
    console.log(`Server is running on ${ipAddress}:${port}`);
    discoveryService.start();
  });
});

// :: Handle second instance
app.on("second-instance", (event, commandLine, workingDirectory) => {
  // :: Someone tried to run a second instance, focus our window instead
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// :: Clean up on quit
app.on("will-quit", () => {
  discoveryService.stop();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

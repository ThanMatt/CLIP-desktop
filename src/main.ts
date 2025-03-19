import { app, BrowserWindow, clipboard, ipcMain, shell } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import express, { Response } from "express";
import morgan from "morgan";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import os from "os";
import { ClipDiscoveryService } from "./services/ClipDiscoveryService";
import { SettingsManager } from "./services/SettingsManagerService";
import {
  generateUrlScheme,
  getServerIp,
  isRedditUrl,
  isYoutubeUrl,
} from "./utils";
import { ClipService } from "./services/ClipService";
import { Server } from "./types";

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

  // :: Receive text FROM phone devices or clip servers
  expressApp.post("/api/text", (req, res) => {
    const { content } = req.body;
    const deviceName = req.body.device_name ?? "Device";
    const clipService = new ClipService(mainWindow);

    return clipService.receiveTextContent(content, deviceName);
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

  // :: Send content to phones
  expressApp.post("/api/content", (req, res) => {
    const { content } = req.body;

    if (currentSession) {
      const clipService = new ClipService(mainWindow);

      clipService.respondContentToDevice(
        content,
        currentSession,
        pollingRequest
      );
      currentSession = null;
      return res.status(200).json({ success: true });
    }

    return res
      .status(400)
      .json({ success: false, message: "No current session found" });
  });

  // :: Receive image
  expressApp.post("/api/image", upload.single("file"), async (req, res) => {
    const deviceName = req.body.device_name ?? "Device";

    if (req.file) {
      const clipService = new ClipService(mainWindow);

      try {
        await clipService.processImageContent(
          req.file,
          deviceName,
          app.getPath("userData")
        );
      } catch (error) {
        return res.status(500).json({ success: false });
      }

      return res.status(200).json({ success: true });
    } else {
      console.log(`No file from ${deviceName} uploaded`);
      return res.status(400).json({ success: false });
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

  // :: Invoked by the app
  ipcMain.handle("respond-content-to-device", (_, content: string) => {
    if (currentSession) {
      const clipService = new ClipService(mainWindow);

      clipService.respondContentToDevice(
        content,
        currentSession,
        pollingRequest
      );
      currentSession = null;
      return true;
    }
  });
  // :: Send content to other CLIP server
  ipcMain.handle(
    "send-content-to-server",
    async (
      _,
      {
        server,
        content,
      }: {
        server: Server;
        content: string;
      }
    ) => {
      try {
        const deviceName = os.hostname();
        const serverUrl = `http://${server.ip}:${server.port}`;

        const response = await fetch(`${serverUrl}/api/text`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content,
            device_name: deviceName,
          }),
        });

        await response.json();

        return true;
      } catch (error) {
        console.error(error);
        throw new Error(
          `There was an error sending an API request to another CLIP server: ${JSON.stringify(
            error
          )}`
        );
      }
    }
  );
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

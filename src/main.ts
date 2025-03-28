import {
  app,
  BrowserWindow,
  clipboard,
  ipcMain,
  Menu,
  nativeTheme,
  Notification,
  Tray,
} from "electron";
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
import { getServerIp } from "./utils";
import { ClipService } from "./services/ClipService";
import {
  FilePayload,
  IpcResponse,
  SendContentToServerPayload,
  Server,
  Settings,
} from "./types";

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
let tray;

const settingsManager = new SettingsManager();
const discoveryService = new ClipDiscoveryService(port, settingsManager);

app.setLoginItemSettings({
  openAtLogin: settingsManager.getLaunchOnStartup(),
});

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    title: "CLIP Desktop by Thanmatt",
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      devTools: Boolean(MAIN_WINDOW_VITE_DEV_SERVER_URL),
    },
    icon: "../assets/icons/icon.png",
  });

  if (!MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    Menu.setApplicationMenu(null);
  }
  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  mainWindow.on("close", (event) => {
    // If the app is really quitting, let it close
    if (app.isQuitting) return;

    const minimizeOnClose = settingsManager.getMinimizeOnClose();

    if (minimizeOnClose) {
      // Otherwise, prevent default close behavior
      event.preventDefault();

      // Hide the window instead
      mainWindow.hide();

      new Notification({
        title: "CLIP Desktop will continue running in the background",
      }).show();

      return false;
    }
    return true;
  });
};

function createTray() {
  tray = new Tray(path.join(__dirname, "clip_icon.png"));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open",
      click: function () {
        mainWindow.show();
      },
    },
    {
      label: "Quit",
      click: function () {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip("CLIP");
  tray.setContextMenu(contextMenu);
  tray.on("click", () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
}

function setupExpressRoutes() {
  expressApp.get("/api", (req, res) => {
    return res.status(200).json({
      success: true,
    });
  });

  // :: Receive text FROM phone devices or clip servers
  expressApp.post("/api/text", (req, res) => {
    const { content } = req.body;
    const deviceName = req.body.device_name ?? "Device";
    const clipService = new ClipService(mainWindow);

    clipService.receiveTextContent(content, deviceName);

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
        await clipService.processFileContent(
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
  expressApp.post("/api/client", (req, res) => {
    // :: Open client application
    const { device_name = "Unnamed device" } = req.body;

    new Notification({
      title: `Opened by device ${device_name}`,
      body: "This device is requesting content",
    }).show();
    if (mainWindow.isMinimized()) mainWindow.restore();
    if (!mainWindow.isVisible()) mainWindow.show();
    mainWindow.focus();
    res.status(200).json({ success: true });
  });
}

// :: IPC handlers for renderer process communication
function setupIpcHandlers() {
  // :: Get active servers
  ipcMain.handle("get-servers", (): IpcResponse<Server[]> => {
    const servers = discoveryService.getActiveServers();
    return {
      success: true,
      message: "Success",
      data: servers,
    };
  });

  // :: Get settings
  ipcMain.handle("get-settings", (): IpcResponse<Settings> => {
    const settings = discoveryService.getSettings();
    return {
      success: true,
      message: "Success",
      data: settings,
    };
  });

  // :: Update settings
  ipcMain.handle(
    "update-settings",
    async (event, settings: Settings): Promise<IpcResponse<boolean>> => {
      try {
        await settingsManager.updateSettings(settings);
        const theme = settings.darkMode ? "dark" : "light";
        nativeTheme.themeSource = theme;
        app.setLoginItemSettings({
          openAtLogin: settings.launchOnStartup,
        });

        return {
          success: true,
          message: "Success",
        };
      } catch (error) {
        throw error;
      }
    }
  );

  // :: Copy text to clipboard
  ipcMain.handle("copy-to-clipboard", (event, text): IpcResponse<void> => {
    clipboard.writeText(text);
    return {
      success: true,
      message: "Success",
    };
  });

  // :: Invoked by the app
  ipcMain.handle(
    "respond-content-to-device",
    (_, content: string): IpcResponse<void> => {
      try {
        if (currentSession) {
          const clipService = new ClipService(mainWindow);

          clipService.respondContentToDevice(
            content,
            currentSession,
            pollingRequest
          );
          currentSession = null;
          return {
            message: "Success",
            success: true,
          };
        } else {
          return {
            success: false,
            message: "No current session found",
          };
        }
      } catch (error) {
        throw error;
      }
    }
  );
  ipcMain.handle(
    "respond-file-to-device",
    async (_, fileData: FilePayload[]): Promise<IpcResponse<void>> => {
      console.log("🚀 ~ fileData:", fileData);
      try {
        if (currentSession && fileData.length > 0) {
          const clipService = new ClipService(mainWindow);
          console.log("FILES: ", fileData);
          const file = fileData[0];

          await clipService.respondFileToDevice(
            file,
            currentSession,
            pollingRequest,
            app.getPath("userData")
          );

          currentSession = null;
          return {
            message: "Success",
            success: true,
          };
        } else {
          return {
            success: false,
            message: "No current session found",
          };
        }
      } catch (error) {
        throw error;
      }
    }
  );
  // :: Send content to other CLIP server
  ipcMain.handle(
    "send-content-to-server",
    async (
      _,
      { server, content }: SendContentToServerPayload
    ): Promise<IpcResponse<void>> => {
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

        if (!response.ok) {
          return {
            success: false,
            message:
              "There was error sending content to another CLIP Server. Please try again",
          };
        }

        return {
          success: true,
          message: "Success",
        };
      } catch (error) {
        console.error(error);
        throw error;
      }
    }
  );
}

app.on("ready", async () => {
  await settingsManager.load();
  createWindow();
  setupExpressRoutes();
  setupIpcHandlers();
  nativeTheme.themeSource = settingsManager.getDarkMode() ? "dark" : "light";

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

app.whenReady().then(() => {
  createTray();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("before-quit", () => {
  app.isQuitting = true;
});

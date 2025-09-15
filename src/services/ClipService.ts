import { BrowserWindow, clipboard, Notification, shell } from "electron";
import { Response } from "express";
import {
  generateUrlScheme,
  getServerIp,
  isRedditUrl,
  isYoutubeUrl,
} from "../utils";
import path from "node:path";
import fs from "fs";
import { FilePayload } from "src/types";

export class ClipService {
  public mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  receiveTextContent(content: string, deviceName = "Device") {
    console.log(`Data received from ${deviceName}: ${content}`);

    // :: Write to clipboard
    clipboard.writeText(content);

    // :: Send notification
    new Notification({
      title: `New content from ${deviceName}`,
      body: `Content: ${content}`,
    }).show();

    // :: Notify renderer process
    if (this.mainWindow) {
      this.mainWindow.webContents.send("text-received", {
        content,
        deviceName,
      });
    }

    // :: Open URL if it's a link
    if (content.startsWith("https") || content.startsWith("http")) {
      console.log("Link detected, opening the url in your default browser!");
      shell.openExternal(content);
    }

    console.log("Notification sent!");
  }
  respondContentToDevice(
    content: string,
    currentSession: NodeJS.Timeout,
    pollingRequest: { res: Response },
  ) {
    console.log("Payload received");
    console.log("Payload: ", content);
    let urlScheme: string = null;

    if (isYoutubeUrl(content)) {
      urlScheme = generateUrlScheme(content, "youtube");
    } else if (isRedditUrl(content)) {
      urlScheme = generateUrlScheme(content, "reddit");
    }

    console.log("url scheme: ", urlScheme);
    clearTimeout(currentSession);

    if (!content) {
      pollingRequest.res.status(200).json({ success: false });
    }
    pollingRequest.res
      .status(200)
      .json({ content, ...(urlScheme && { urlScheme }) });

    // :: Notify renderer process
    this.mainWindow.webContents.send("content-received", {
      content,
      urlScheme,
    });
  }

  async respondFileToDevice(
    file: FilePayload,
    currentSession: NodeJS.Timeout,
    pollingRequest: { res: Response },
    pathDirectory: string,
  ) {
    console.log("🚀 ~ ClipService ~ file:", file);
    if (file) {
      const shareablesDir = path.join(pathDirectory, "shareables");

      // Ensure shareables directory exists
      if (!fs.existsSync(shareablesDir)) {
        fs.mkdirSync(shareablesDir, { recursive: true });
      }

      const savePath = path.join(shareablesDir, file.name);
      const data = Buffer.from(file.data);

      // Save file to shareables directory
      fs.writeFileSync(savePath, data);

      // Generate file URL (assuming server runs on the same port)
      const serverPort = process.env.SERVER_PORT || 5050;
      const serverIp = getServerIp();
      const fileUrl = `http://${serverIp}:${serverPort}/api/files/${encodeURIComponent(file.name)}`;

      clearTimeout(currentSession);
      pollingRequest.res.status(200).json({
        success: true,
        fileUrl,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });
    }
  }

  processFileContent(
    file: Express.Multer.File,
    deviceName = "Device",
    pathDirectory: string,
  ): Promise<boolean> {
    console.log(
      `File from ${deviceName} has been uploaded successfully: ${file}`,
    );

    const filePath = path.join(pathDirectory, "uploads", file.originalname);
    const fileType = file.mimetype;

    console.log("File path: ", filePath);

    return new Promise((resolve, reject) => {
      try {
        // :: Use Electron's clipboard API for images
        if (fileType.startsWith("image/")) {
          const nativeImage =
            require("electron").nativeImage.createFromPath(filePath);
          clipboard.writeImage(nativeImage);
        }
        if (this.mainWindow) {
          this.mainWindow.webContents.send("file-received", {
            path: filePath,
            deviceName,
          });
        }
        resolve(true);
      } catch (error) {
        reject(
          new Error(
            `There was an processing your file: ${JSON.stringify(error)}`,
          ),
        );
      }
    });
  }
}

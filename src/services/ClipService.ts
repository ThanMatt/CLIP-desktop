import { BrowserWindow, clipboard, Notification, shell } from "electron";
import { Response } from "express";
import { generateUrlScheme, isRedditUrl, isYoutubeUrl } from "../utils";
import path from "node:path";
import { exec } from "node:child_process";

export class ClipService {
  public mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  receiveTextContent(content: string, deviceName: string = "Device") {
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
    pollingRequest: { res: Response }
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

  processFileContent(
    file: Express.Multer.File,
    deviceName: string = "Device",
    pathDirectory: string
  ): Promise<boolean> {
    console.log(
      `File from ${deviceName} has been uploaded successfully: ${file}`
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
            `There was an processing your file: ${JSON.stringify(error)}`
          )
        );
      }
    });
  }
}

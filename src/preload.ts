// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";
import {
  Callback,
  FilePayload,
  RespondContentToDevicePayload,
  RespondFileToDevicePayload,
  SendContentToServerPayload,
  Settings,
  TextPayload,
} from "./types";

contextBridge.exposeInMainWorld("api", {
  getServers: () => ipcRenderer.invoke("get-servers"),
  getSettings: () => ipcRenderer.invoke("get-settings"),
  updateSettings: (payload: Settings) => {
    return ipcRenderer.invoke("update-settings", payload);
  },
  copyToClipboard: (text: string) => {
    return ipcRenderer.invoke("copy-to-clipboard", text);
  },
  onTextReceived: (callback: Callback<TextPayload>) => {
    return ipcRenderer.on("text-received", (event, data) => {
      return callback(data);
    });
  },
  onContentReceived: (callback: Callback<TextPayload>) => {
    ipcRenderer.on("content-received", (event, data) => callback(data));
  },
  onImageReceived: (callback: Callback<TextPayload>) => {
    ipcRenderer.on("image-received", (event, data) => callback(data));
  },
  onServersUpdated: (callback: Callback<TextPayload>) => {
    ipcRenderer.on("servers-updated", (event, servers) => callback(servers));
  },
  respondContentToDevice: (payload: RespondContentToDevicePayload) => {
    return ipcRenderer.invoke("respond-content-to-device", payload);
  },
  sendContentToServer: (payload: SendContentToServerPayload) => {
    return ipcRenderer.invoke("send-content-to-server", payload);
  },
  respondFileToDevice: (payload: RespondFileToDevicePayload) => {
    console.log("🚀 ~ payload:", payload);
    return ipcRenderer.invoke("respond-file-to-device", payload.fileData);
  },
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  openExternal: (url: string) => ipcRenderer.invoke("open-external", url),
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
});

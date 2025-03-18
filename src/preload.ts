// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

export type Callback = (data: any) => void;

contextBridge.exposeInMainWorld("api", {
  getServers: () => ipcRenderer.invoke("get-servers"),
  getSettings: () => ipcRenderer.invoke("get-settings"),
  copyToClipboard: (text: string) => {
    return ipcRenderer.invoke("copy-to-clipboard", text);
  },
  onTextReceived: (callback: Callback) => {
    return ipcRenderer.on("text-received", (event, data) => {
      return callback(data);
    });
  },
  onContentReceived: (callback: Callback) => {
    ipcRenderer.on("content-received", (event, data) => callback(data));
  },
  onImageReceived: (callback: Callback) => {
    ipcRenderer.on("image-received", (event, data) => callback(data));
  },
  onServersUpdated: (callback: Callback) => {
    ipcRenderer.on("servers-updated", (event, servers) => callback(servers));
  },
});

import {
  Settings,
  Callback,
  TextPayload,
  SendContentToServerPayload,
  RespondContentToDevicePayload,
  Server,
  IpcResponse,
} from "./types";

interface ElectronAPI {
  getServers: () => Promise<IpcResponse<Server[]>>;
  getSettings: () => Promise<IpcResponse<Settings>>;
  updateSettings: (settings: {
    isDiscoverable: boolean;
  }) => Promise<IpcResponse<boolean>>;
  copyToClipboard: (text: string) => IpcResponse<void>;
  respondContentToDevice: (
    payload: RespondContentToDevicePayload
  ) => Promise<IpcResponse<void>>;
  sendContentToServer: (
    payload: SendContentToServerPayload
  ) => Promise<IpcResponse<void>>;
  onTextReceived: (callback: Callback<TextPayload>) => void;
  onContentReceived: (callback: (data: ContentReceivedData) => void) => void;
  onImageReceived: (callback: (data: ImageReceivedData) => void) => void;
  onServersUpdated: (callback: (servers: ServerInfo[]) => void) => void;
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
  namespace Electron {
    interface App {
      isQuitting: boolean;
    }
  }
}

export {};

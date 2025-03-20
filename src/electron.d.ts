import {
  Settings,
  Callback,
  TextPayload,
  SendContentToServerPayload,
  RespondContentToDevicePayload,
  Server,
} from "./types";

interface ElectronAPI {
  getServers: () => Promise<Server[]>;
  getSettings: () => Promise<Settings>;
  updateSettings: (settings: { isDiscoverable: boolean }) => Promise<boolean>;
  copyToClipboard: (text: string) => Promise<boolean>;
  respondContentToDevice: (
    payload: RespondContentToDevicePayload
  ) => Promise<boolean>;
  sendContentToServer: (
    payload: SendContentToServerPayload
  ) => Promise<boolean>;
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

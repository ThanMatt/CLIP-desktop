import { ActiveServer, Settings, Callback, TextPayload } from "./types";

interface ElectronAPI {
  getServers: () => Promise<ActiveServer[]>;
  getSettings: () => Promise<Settings>;
  updateSettings: (settings: { isDiscoverable: boolean }) => Promise<boolean>;
  copyToClipboard: (text: string) => Promise<boolean>;
  onTextReceived: (callback: Callback<TextPayload>) => void;
  onContentReceived: (callback: (data: ContentReceivedData) => void) => void;
  onImageReceived: (callback: (data: ImageReceivedData) => void) => void;
  onServersUpdated: (callback: (servers: ServerInfo[]) => void) => void;
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}

export {};

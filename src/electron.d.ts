import { ActiveServer, Settings } from "./types";

interface ElectronAPI {
  getServers: () => Promise<ActiveServer[]>;
  getSettings: () => Promise<Settings>;
  updateSettings: (settings: { isDiscoverable: boolean }) => Promise<boolean>;
  copyToClipboard: (text: string) => Promise<boolean>;
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}

export {};

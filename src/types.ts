export interface Server {
  id: string;
  ip: string;
  port: number;
  deviceName: string;
  lastSeen: number;
}

export interface GetServersResponse {
  servers: Array<Server>;
}

export interface SendTextToServerArgs {
  targetUrl: string;
  content: string;
}

export interface Settings {
  isDiscoverable: boolean;
  serverIp: string;
  serverPort: number;
  launchOnStartup: boolean;
  darkMode: boolean;
  errorLogging: boolean;
  minimizeOnClose: boolean;
}

export interface Announcement {
  service: string;
  type: string;
  deviceName: string;
  port: number;
  timestamp: number;
}

export type Callback<T> = (data: T) => void;

export interface TextPayload {
  content: string;
  deviceName?: string;
}

export interface SendContentToServerPayload {
  content: string;
  server: Server;
}

export interface RespondContentToDevicePayload {
  content: string;
}

export interface IpcResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface FilePayload {
  name: string;
  path: string;
  type: string;
  size: number;
  data: number[];
}

export interface RespondFileToDevicePayload {
  fileData: FilePayload[];
}

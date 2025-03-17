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
}

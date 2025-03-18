import fs from "fs/promises";
import path from "path";
import { getServerIp } from "../utils";
import { Settings } from "../types";

export class SettingsManager {
  public settingsPath: string;
  public settings: Settings;
  constructor() {
    this.settingsPath = path.join(process.cwd(), "settings.json");
    this.settings = {
      isDiscoverable: true,
      serverIp: getServerIp(),
      serverPort: Number(process.env.SERVER_PORT) || 5000,
    };
  }

  async load() {
    try {
      const data = await fs.readFile(this.settingsPath, "utf8");

      this.settings.serverIp = getServerIp();
      this.settings.serverPort = Number(process.env.SERVER_PORT) || 5000;
      this.settings = JSON.parse(data);
      this.save();
    } catch (error) {
      // :: If file doesn't exist, create it with default settings
      await this.save();
    }
    return this.settings;
  }

  async save() {
    await fs.writeFile(
      this.settingsPath,
      JSON.stringify(this.settings, null, 2)
    );
  }

  async setDiscoverable(isDiscoverable: boolean) {
    this.settings.isDiscoverable = isDiscoverable;
    await this.save();
    return isDiscoverable;
  }

  async updateServerIp() {
    this.settings.serverIp = getServerIp();
    this.settings.serverPort = Number(process.env.SERVER_PORT) || 5000;

    await this.save();
  }

  getDiscoverable() {
    return this.settings.isDiscoverable;
  }

  getSettings() {
    return this.settings;
  }
}

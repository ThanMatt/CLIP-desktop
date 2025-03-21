import fs from "fs/promises";
import path from "path";
import { getServerIp } from "../utils";
import { Settings } from "../types";
import { app, nativeTheme } from "electron";

export class SettingsManager {
  public settingsPath: string;
  public settings: Settings;
  constructor() {
    this.settingsPath = path.join(app.getPath("userData"), "settings.json");
    this.settings = {
      isDiscoverable: true,
      serverIp: getServerIp(),
      serverPort: Number(process.env.SERVER_PORT) || 5000,
      launchOnStartup: false,
      darkMode: nativeTheme.shouldUseDarkColors,
      errorLogging: false,
      minimizeOnClose: false,
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

  async setLaunchOnStartup(launchOnStartup: boolean) {
    this.settings.launchOnStartup = launchOnStartup;
    await this.save();
    return launchOnStartup;
  }

  async updateServerIp() {
    this.settings.serverIp = getServerIp();
    this.settings.serverPort = Number(process.env.SERVER_PORT) || 5000;

    await this.save();
  }

  getDiscoverable() {
    return this.settings.isDiscoverable;
  }

  getLaunchOnStartup() {
    return this.settings.launchOnStartup;
  }

  getDarkMode() {
    return this.settings.darkMode;
  }

  getMinimizeOnClose() {
    return this.settings.minimizeOnClose;
  }

  getSettings() {
    return this.settings;
  }

  async updateSettings(settings: Settings) {
    this.settings = settings;
    await this.save();
  }
}

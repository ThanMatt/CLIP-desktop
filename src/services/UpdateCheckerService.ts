export interface UpdateInfo {
  hasUpdate: boolean;
  latestVersion: string;
  currentVersion: string;
  downloadUrl?: string;
  releaseNotes?: string;
}

export class UpdateCheckerService {
  private static readonly GITHUB_API_URL =
    "https://api.github.com/repos/thanmatt/CLIP-desktop/releases/latest";
  private static readonly CHECK_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours

  private lastCheckTime = 0;
  private cachedUpdateInfo: UpdateInfo | null = null;

  constructor(private currentVersion: string) {}

  async checkForUpdates(): Promise<UpdateInfo> {
    const now = Date.now();

    // :: Use cached result if checked recently
    if (
      this.cachedUpdateInfo &&
      now - this.lastCheckTime < UpdateCheckerService.CHECK_INTERVAL
    ) {
      return this.cachedUpdateInfo;
    }

    try {
      const response = await fetch(UpdateCheckerService.GITHUB_API_URL);

      if (!response.ok) {
        throw new Error(`GitHub API responded with ${response.status}`);
      }

      const release = await response.json();
      const latestVersion = release.tag_name.replace(/^v/, ""); // Remove 'v' prefix
      const currentVersionClean = this.currentVersion.replace(/^v/, "");

      const updateInfo: UpdateInfo = {
        hasUpdate: this.isNewerVersion(latestVersion, currentVersionClean),
        latestVersion,
        currentVersion: currentVersionClean,
        downloadUrl: release.html_url,
        releaseNotes: release.body,
      };

      this.cachedUpdateInfo = updateInfo;
      this.lastCheckTime = now;

      return updateInfo;
    } catch (error) {
      console.error("Failed to check for updates:", error);

      // :: Return cached result or default
      return (
        this.cachedUpdateInfo || {
          hasUpdate: false,
          latestVersion: this.currentVersion,
          currentVersion: this.currentVersion,
        }
      );
    }
  }

  private isNewerVersion(latest: string, current: string): boolean {
    // :: Simple version comparison for semantic versioning
    const parseVersion = (version: string) => {
      const parts = version.split("-");
      const mainVersion = parts[0];
      const prerelease = parts[1] || "";

      const [major, minor, patch] = mainVersion.split(".").map(Number);
      return { major, minor, patch, prerelease };
    };

    const latestParsed = parseVersion(latest);
    const currentParsed = parseVersion(current);

    // :: Compare major.minor.patch
    if (latestParsed.major !== currentParsed.major) {
      return latestParsed.major > currentParsed.major;
    }
    if (latestParsed.minor !== currentParsed.minor) {
      return latestParsed.minor > currentParsed.minor;
    }
    if (latestParsed.patch !== currentParsed.patch) {
      return latestParsed.patch > currentParsed.patch;
    }

    // :: If main versions are equal, compare prereleases
    if (!latestParsed.prerelease && currentParsed.prerelease) {
      return true; // Stable is newer than prerelease
    }
    if (latestParsed.prerelease && !currentParsed.prerelease) {
      return false; // :: Prerelease is older than stable
    }
    if (latestParsed.prerelease && currentParsed.prerelease) {
      return latestParsed.prerelease > currentParsed.prerelease;
    }

    return false; // :: Versions are equal
  }

  clearCache(): void {
    this.cachedUpdateInfo = null;
    this.lastCheckTime = 0;
  }
}


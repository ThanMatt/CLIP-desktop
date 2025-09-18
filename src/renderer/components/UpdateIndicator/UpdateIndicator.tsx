import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Download, RefreshCw, ExternalLink } from "lucide-react";

interface UpdateInfo {
  hasUpdate: boolean;
  latestVersion: string;
  currentVersion: string;
  downloadUrl?: string;
  releaseNotes?: string;
}

type UpdateIndicatorProps = {
  compact?: boolean;
};

const UpdateIndicator = ({ compact = false }: UpdateIndicatorProps) => {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkForUpdates = async () => {
    setIsChecking(true);
    setError(null);

    try {
      const response = await window.api.checkForUpdates();
      if (response.success) {
        setUpdateInfo(response.data);
      } else {
        setError(response.message || "Failed to check for updates");
      }
    } catch (err) {
      setError("Network error while checking for updates");
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // :: Check for updates on component mount
    checkForUpdates();
  }, []);

  const handleDownload = () => {
    if (updateInfo?.downloadUrl) {
      window.api.openExternal(updateInfo.downloadUrl);
    }
  };

  if (compact) {
    // :: Compact version for settings or header
    return (
      <div className="flex items-center gap-2">
        {updateInfo?.hasUpdate && (
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-blue-600 dark:text-blue-400">
              Update available
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={checkForUpdates}
          disabled={isChecking}
        >
          <RefreshCw
            className={`h-3 w-3 ${isChecking ? "animate-spin" : ""}`}
          />
        </Button>
      </div>
    );
  }

  // :: Full version for About dialog
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Updates</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={checkForUpdates}
          disabled={isChecking}
        >
          <RefreshCw
            className={`h-3 w-3 mr-1 ${isChecking ? "animate-spin" : ""}`}
          />
          Check
        </Button>
      </div>

      {error && (
        <div className="text-xs text-red-600 dark:text-red-400">{error}</div>
      )}

      {updateInfo && !isChecking && (
        <div className="space-y-2">
          {updateInfo.hasUpdate ? (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Download className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Update Available
                </span>
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <div>Current: v{updateInfo.currentVersion}</div>
                <div>Latest: v{updateInfo.latestVersion}</div>
              </div>
              <Button
                size="sm"
                className="w-full mt-2"
                onClick={handleDownload}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Download Update
              </Button>
            </div>
          ) : (
            <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              You're using the latest version
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UpdateIndicator;


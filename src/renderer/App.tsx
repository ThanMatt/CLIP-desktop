import { ShareContentCard } from "./components/ShareContentCard";
import { ServerSelectionCard } from "./components/ServerSelectionCard";
import { ContentConfirmationDialog } from "./components/ContentConfirmationDialog";
import { useEffect, useState } from "react";
import { Server, Settings } from "../types";

interface PendingContentConfirmation {
  id: string;
  deviceName: string;
  content: string;
  contentType: "text" | "file";
}

function App() {
  const [targetServer, setTargetServer] = useState<Server | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [pendingConfirmation, setPendingConfirmation] =
    useState<PendingContentConfirmation | null>(null);

  useEffect(() => {
    const getSettings = async () => {
      const response = await window.api.getSettings();
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      const savedTheme = response.data.darkMode ? "dark" : "";

      if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
        document.documentElement.classList.add("dark");
      }
      setSettings(response.data);
    };

    getSettings();
  }, []);

  useEffect(() => {
    // :: Listen for content confirmation requests
    const handleContentConfirmationRequest = (data: any) => {
      setPendingConfirmation({
        id: data.id,
        deviceName: data.deviceName,
        content: data.content,
        contentType: data.contentType || "text",
      });
    };

    window.api.onContentConfirmationRequest?.(handleContentConfirmationRequest);

    return () => {
      // :: Cleanup listener if needed
    };
  }, []);

  useEffect(() => {
    if (settings?.darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings]);

  const handleTargetServer = (server: Server | null) => {
    setTargetServer(server);
  };

  const handleChangeSettings = async (updatedSettings: Settings) => {
    try {
      setSettings(updatedSettings);

      await window.api.updateSettings(updatedSettings);
    } catch (error) {
      setSettings(settings);
    }
  };

  const handleAcceptContent = async () => {
    if (pendingConfirmation) {
      await window.api.respondToContentConfirmation?.(
        pendingConfirmation.id,
        true,
      );
      setPendingConfirmation(null);
    }
  };

  const handleDeclineContent = async () => {
    if (pendingConfirmation) {
      await window.api.respondToContentConfirmation?.(
        pendingConfirmation.id,
        false,
      );
      setPendingConfirmation(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <ServerSelectionCard
          onTargetServer={handleTargetServer}
          onChangeSettings={handleChangeSettings}
          settings={settings}
        />
        <ShareContentCard targetServer={targetServer} />
      </div>

      {pendingConfirmation && (
        <ContentConfirmationDialog
          open={true}
          deviceName={pendingConfirmation.deviceName}
          content={pendingConfirmation.content}
          contentType={pendingConfirmation.contentType}
          onAccept={handleAcceptContent}
          onDecline={handleDeclineContent}
        />
      )}
    </div>
  );
}

export default App;

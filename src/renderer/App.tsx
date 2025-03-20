import { ShareContentCard } from "./components/ShareContentCard";
import { ServerSelectionCard } from "./components/ServerSelectionCard";
import { useEffect, useState } from "react";
import { Server, Settings } from "../types";

function App() {
  const [targetServer, setTargetServer] = useState<Server | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    const getSettings = async () => {
      const response = await window.api.getSettings();
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
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
    </div>
  );
}

export default App;

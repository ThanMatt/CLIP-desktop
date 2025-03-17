import { ShareContentCard } from "./components/ShareContentCard";
import { ServerSelectionCard } from "./components/ServerSelectionCard";
import { useEffect, useState } from "react";
import { Server, Settings } from "./types";
import axiosInstance from "./config/axios";

function App() {
  const [targetServer, setTargetServer] = useState<Server | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    const getSettings = async () => {
      const response = await axiosInstance.get<Settings>("/api/settings");

      setSettings(response.data);
    };

    getSettings();
  }, []);

  const handleTargetServer = (server: Server | null) => {
    setTargetServer(server);
  };

  const handleChangeSettings = async (updatedSettings: Settings) => {
    try {
      setSettings(updatedSettings);

      await axiosInstance.patch("/api/settings", {
        settings: updatedSettings,
      });
    } catch (error) {
      setSettings(settings);
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 p-4">
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

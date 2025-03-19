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
      console.log("🚀 ~ getSettings ~ response:", response);

      setSettings(response);
    };

    getSettings();
  }, []);

  const handleTargetServer = (server: Server | null) => {
    setTargetServer(server);
  };

  const handleChangeSettings = async (updatedSettings: Settings) => {
    try {
      console.log("SETTINGS CHANGED", updatedSettings);
      setSettings(updatedSettings);

      await window.api.updateSettings(updatedSettings);
    } catch (error) {
      setSettings(settings);
    }
  };

  console.log("Settings :", settings);
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

import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import { RefreshCcw, Settings as SettingsIcon, Wifi } from "lucide-react";
import { Server, Settings } from "../../../types";
import { Subtle } from "../ui/typography";
import { ServerButton } from "../ServerButton";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { cn } from "@/lib/utils";
import { SettingsPopover } from "../SettingsPopover";
import { AboutDialog } from "../AboutDialog";
import { LogsDialog } from "../LogsDialog";

type ServerSelectionCardProps = {
  onTargetServer: (server: Server | null) => void;
  onChangeSettings: (updatedSettings: Settings) => void;
  settings: Settings | null;
};

const ServerSelectionCard = ({
  onTargetServer,
  onChangeSettings,
  settings,
}: ServerSelectionCardProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [servers, setServers] = useState<Server[] | null>(null);
  const [dots, setDots] = useState("");
  const [, setErrors] = useState<string | null>(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);

  const [selectedServer, setSelectedServer] = useState<Server | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, [isScanning]);

  const handleSelectServer = (server: Server | null) => {
    if (server?.id === selectedServer?.id && selectedServer) {
      onTargetServer(null);
      setSelectedServer(null);
    } else {
      setSelectedServer(server);
      onTargetServer(server);
    }
  };

  const getServers = async () => {
    const response = await window.api.getServers();
    return response.data;
  };

  const handleGetServers = async () => {
    setIsScanning(true);
    const data = await getServers();

    setIsScanning(false);
    setServers(data);
  };

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setIsScanning(true);

        const data = await getServers();
        if (mounted) {
          setServers(data);
          setErrors(null);
        }
      } catch (err) {
        if (mounted) {
          setErrors("Failed to fetch data");
          console.error("Polling error:", err);
        }
      } finally {
        if (mounted) {
          setIsScanning(false);
        }
      }
    };

    const pollInterval = setInterval(() => {
      fetchData();
    }, 5000); // :: Poll every 5 seconds

    fetchData();

    return () => {
      mounted = false;
      clearInterval(pollInterval);
    };
  }, []);

  useEffect(() => {
    if (selectedServer) {
      const selectedStillExist = servers.find((server) => {
        return server?.id === selectedServer.id;
      });

      if (!selectedStillExist) {
        handleSelectServer(null);
      }
    }
  }, [servers]);

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const response = await window.api.checkForUpdates();
        if (response.success && response.data.hasUpdate) {
          setHasUpdate(true);
        }
      } catch (error) {
        console.error("Failed to check for updates:", error);
      }
    };

    checkForUpdates();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">
              Available Servers
            </CardTitle>
            <CardDescription>
              Your CLIP server IP:{" "}
              <Label>
                {settings?.serverIp && settings?.serverPort
                  ? `${settings?.serverIp}:${settings?.serverPort}`
                  : "-"}
              </Label>
            </CardDescription>
            <CardDescription>
              Share content to CLIP servers on your network
            </CardDescription>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                onCheckedChange={() => {
                  if (settings) {
                    onChangeSettings({
                      ...settings,
                      isDiscoverable: !settings?.isDiscoverable,
                    });
                  }
                }}
                id="isDiscoverable"
                checked={!!settings?.isDiscoverable}
              />
              <Label
                className={
                  settings?.isDiscoverable
                    ? "font-medium"
                    : "font-light text-muted-foreground"
                }
                htmlFor="isDiscoverable"
              >
                Discoverable
              </Label>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleGetServers}
              disabled={isScanning}
            >
              <RefreshCcw
                className={cn("h-4 w-4", isScanning ? "animate-spin" : "")}
              />
            </Button>
            <div className="relative">
              <SettingsPopover
                settings={settings}
                onCheckedChange={(settingName, value) => {
                  if (settings) {
                    onChangeSettings({
                      ...settings,
                      [settingName]: value,
                    });
                  }
                }}
                onAboutClick={() => {
                  setIsAboutOpen(true);
                  setHasUpdate(false); // Clear badge when opening About
                }}
                onLogsClick={() => setIsLogsOpen(true)}
              />
              {hasUpdate && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-background animate-pulse" />
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wifi className="h-4 w-4" />
              <span>Discovered Servers</span>
            </div>

            <div className="space-y-2">
              {servers && servers.length ? (
                servers.map((server) => (
                  <ServerButton
                    key={server.id}
                    selectedServer={selectedServer}
                    onSelectServer={handleSelectServer}
                    server={server}
                  />
                ))
              ) : (
                <div>
                  <Subtle>Finding servers{dots}</Subtle>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <AboutDialog
        open={isAboutOpen}
        onOpenChange={(open) => {
          setIsAboutOpen(open);
          if (open) {
            setHasUpdate(false); // Clear badge when opening About
          }
        }}
      />
      <LogsDialog
        open={isLogsOpen}
        onOpenChange={setIsLogsOpen}
      />
    </Card>
  );
};

ServerSelectionCard.displayName = "ServerSelectionCard";

export default ServerSelectionCard;

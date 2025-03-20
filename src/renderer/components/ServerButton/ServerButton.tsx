import { cn } from "@/lib/utils";
import { ServerIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Server } from "@/types";

type ServerButtonProps = {
  server: Server;
  onSelectServer: (server: Server) => void;
  selectedServer: Server | null;
};

const ServerButton = ({
  server,
  onSelectServer,
  selectedServer,
}: ServerButtonProps) => {
  return (
    <Button
      key={server.id}
      variant="outline"
      className={cn(
        "w-full justify-start h-auto py-3",
        selectedServer?.id === server.id
          ? "border-primary bg-accent text-accent-foreground"
          : ""
      )}
      onClick={() => onSelectServer(server)}
    >
      <div className="flex items-start gap-3">
        <ServerIcon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="text-left">
          <div className="font-medium">{server.deviceName}</div>
          <div className="text-sm text-muted-foreground">{server.ip}</div>
        </div>
      </div>
    </Button>
  );
};

ServerButton.displayName = "ServerButton";

export default ServerButton;

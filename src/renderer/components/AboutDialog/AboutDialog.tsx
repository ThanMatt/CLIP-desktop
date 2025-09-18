import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ExternalLink, Github } from "lucide-react";

type AboutDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

const AboutDialog = ({ isOpen, onClose }: AboutDialogProps) => {
  const [version, setVersion] = useState<string>("Unknown");

  useEffect(() => {
    const getVersion = async () => {
      try {
        const response = await window.api.getAppVersion();
        if (response.success) {
          setVersion(response.data);
        }
      } catch (error) {
        console.error("Failed to get app version:", error);
      }
    };

    if (isOpen) {
      getVersion();
    }
  }, [isOpen]);

  const handleGitHubClick = () => {
    window.api.openExternal("https://github.com/thanmatt/CLIP-desktop");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-96 max-w-[90vw]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">CLIP Desktop</CardTitle>
          <p className="text-sm text-muted-foreground">Version {version}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm">
              Transfer texts and files from Windows/Linux PC to iPhone clipboard
            </p>
            <p className="text-xs text-muted-foreground">
              Similar to Apple's AirDrop
            </p>
          </div>

          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleGitHubClick}
            >
              <Github className="h-4 w-4 mr-2" />
              View on GitHub
              <ExternalLink className="h-4 w-4 ml-auto" />
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            <p>Created by Thanmatt</p>
            <p>Licensed under MIT</p>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={onClose}>Close</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AboutDialog;
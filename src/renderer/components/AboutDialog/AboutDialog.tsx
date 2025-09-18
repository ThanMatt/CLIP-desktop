import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { ExternalLink, Github, Mail } from "lucide-react";
import { UpdateIndicator } from "../UpdateIndicator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

type AboutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const AboutDialog = ({ open, onOpenChange }: AboutDialogProps) => {
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

    if (open) {
      getVersion();
    }
  }, [open]);

  const handleGitHubClick = () => {
    window.api.openExternal("https://github.com/thanmatt/CLIP-desktop");
  };

  const handleEmailClick = () => {
    window.api.openExternal("mailto:clip@thanmatt.me");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">CLIP Desktop</DialogTitle>
          <DialogDescription className="text-center">
            Version {version}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm">
              Transfer texts and files from Windows/Linux PC to iPhone clipboard
            </p>
            <p className="text-xs text-muted-foreground">
              Similar to Apple's AirDrop
            </p>
          </div>

          <UpdateIndicator />

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

            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleEmailClick}
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Feedback
              <ExternalLink className="h-4 w-4 ml-auto" />
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground space-y-1">
            <p>Got feedback, found a bug, or have questions?</p>
            <p>Reach out at <span className="font-mono">clip@thanmatt.me</span></p>
            <div className="pt-2">
              <p>Created by Thanmatt</p>
              <p>Licensed under MIT</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AboutDialog;
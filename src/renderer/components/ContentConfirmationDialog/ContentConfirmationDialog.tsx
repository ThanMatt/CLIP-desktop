import { Button } from "../ui/button";
import { AlertTriangle, Smartphone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface ContentConfirmationDialogProps {
  open: boolean;
  deviceName: string;
  content: string;
  contentType: "text" | "file";
  onAccept: () => void;
  onDecline: () => void;
}

const ContentConfirmationDialog = ({
  open,
  deviceName,
  content,
  contentType,
  onAccept,
  onDecline,
}: ContentConfirmationDialogProps) => {
  const truncatedContent = content.length > 200 ? content.substring(0, 200) + "..." : content;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Content Received
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium">{deviceName}</span> wants to send you {contentType === "file" ? "a file" : "text content"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
            <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-500 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium mb-1">Preview:</p>
              <p className="text-muted-foreground break-words font-mono text-xs">
                {truncatedContent}
              </p>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Only accept content from devices you trust. This will be copied to your clipboard.
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onDecline}>
            Decline
          </Button>
          <Button onClick={onAccept}>
            Accept & Copy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContentConfirmationDialog;
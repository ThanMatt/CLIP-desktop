import { cn } from "@/lib/utils";
import { FileIcon, X } from "lucide-react";
import { Button } from "../ui/button";

export type FileItemProps = {
  index: number;
  file: File;
  onRemoveFile: () => void;
  error?: string | null;
};

const FileItem = ({ file, index, onRemoveFile, error }: FileItemProps) => {
  return (
    <div
      key={index}
      className={cn(
        "flex items-center justify-between p-2 bg-gray-50 rounded-md",
        error && "bg-destructive/30",
      )}
    >
      <div className="flex items-center space-x-2">
        <FileIcon className="h-4 w-4 text-gray-500" />
        <span className="text-sm text-gray-700">{file.name}</span>
        <span className="text-xs text-gray-500">
          ({(file.size / 1024).toFixed(0)} KB)
        </span>
      </div>
      <Button
        variant="destructive"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={onRemoveFile}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

FileItem.displayName = "FileItem";

export default FileItem;

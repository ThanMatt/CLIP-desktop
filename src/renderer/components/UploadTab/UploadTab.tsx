import { ArrowUpFromLine } from "lucide-react";
import { Small, Subtle } from "../ui/typography";
import { useFormContext } from "react-hook-form";
import { useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { FileItem } from "../FileItem";
import { ShareContentFormData } from "../ShareContentCard/schema";

const UploadTab = () => {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<ShareContentFormData>();

  const files = watch("files") || [];

  useEffect(() => {
    register("files");
  }, [register]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop: (acceptedFiles) => {
        setValue("files", acceptedFiles, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
      },
      accept: {
        "image/*": [".jpeg", ".jpg", ".png", ".gif"],
      },
    });
  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setValue("files", newFiles.length > 0 ? newFiles : undefined, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive ? "bg-accent border-primary" : "hover:bg-accent"
        )}
      >
        <input {...getInputProps()} />
        <ArrowUpFromLine className="mx-auto h-12 w-12 text-gray-400 mb-4" />{" "}
        <Subtle>
          {isDragActive
            ? "Drop files here..."
            : "Drag and drop files here, or click to select"}
        </Subtle>
        <Subtle className="mt-1">Accepted formats: JPG, PNG, GIF</Subtle>
      </div>
      {errors.files && (
        <Small className="text-red-500 mt-1">{errors.files.message}</Small>
      )}
      {fileRejections.length > 0 && (
        <Small className="text-red-500 mt-1">
          Some files were rejected: Only image files are currently allowed
        </Small>
      )}

      {files.length > 0 && (
        <div className="space-y-4">
          {files.map((file: File, index) => {
            return (
              <FileItem
                key={index}
                file={file}
                index={index}
                onRemoveFile={() => removeFile(index)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

UploadTab.displayName = "UploadTab";

export default UploadTab;

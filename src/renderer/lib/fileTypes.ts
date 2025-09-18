// Centralized file type configuration for reusability across schema and dropzone

export interface FileTypeConfig {
  mimeType: string;
  extensions: string[];
  displayName: string;
}

export const ACCEPTED_FILE_TYPES: FileTypeConfig[] = [
  {
    mimeType: "image/*",
    extensions: [".jpeg", ".jpg", ".png", ".gif"],
    displayName: "Images",
  },
  {
    mimeType: "application/pdf",
    extensions: [".pdf"],
    displayName: "PDF",
  },
  {
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extensions: [".docx"],
    displayName: "DOCX",
  },
];

// Helper functions for easier usage
export const getDropzoneAcceptConfig = () => {
  return ACCEPTED_FILE_TYPES.reduce(
    (acc, fileType) => {
      acc[fileType.mimeType] = fileType.extensions;
      return acc;
    },
    {} as Record<string, string[]>,
  );
};

export const getAcceptedMimeTypes = () => {
  return ACCEPTED_FILE_TYPES.map((ft) => ft.mimeType);
};

export const getDisplayFormats = () => {
  return ACCEPTED_FILE_TYPES.map((ft) => ft.displayName).join(", ");
};

export const isFileTypeAccepted = (file: File) => {
  return ACCEPTED_FILE_TYPES.some((fileType) => {
    if (fileType.mimeType.endsWith("/*")) {
      // Handle wildcard mime types like "image/*"
      const baseType = fileType.mimeType.replace("/*", "/");
      return file.type.startsWith(baseType);
    }
    return file.type === fileType.mimeType;
  });
};


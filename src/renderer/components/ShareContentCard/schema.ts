import * as zod from "zod";

export const schema = zod
  .object({
    content: zod
      .string()
      .optional()
      .refine(
        (val) => {
          // If content is provided, it must not be empty
          return !val || val.trim().length > 0;
        },
        {
          message: "Content cannot be empty",
        },
      ),
    files: zod
      .array(
        zod
          .instanceof(File, {
            message: "Please upload valid files",
          })
          .refine(
            (file) => {
              // :: Check file size (max 10MB)
              return file.size <= 10 * 1024 * 1024;
            },
            {
              message: "File size must be less than 10MB",
            },
          )
          .refine(
            (file) => {
              // :: Check if file is an image or PDF
              return (
                file.type.startsWith("image/") ||
                file.type === "application/pdf"
              );
            },
            {
              message: "Only image and PDF files are allowed",
            },
          ),
      )
      .optional()
      .refine(
        (files) => {
          // If files are provided, limit to 1 file only
          return !files || files.length <= 1;
        },
        {
          message: "Only 1 file allowed for now",
        },
      ),
  })
  .refine(
    (data) => {
      // :: At least one of content or files must be provided
      return (
        (data.content && data.content.trim().length > 0) ||
        (data.files && data.files.length > 0)
      );
    },
    {
      message: "You must provide either text content or upload files",
      path: ["root"], // :: This sets the error at the form level
    },
  );
export type ShareContentFormData = zod.infer<typeof schema>;

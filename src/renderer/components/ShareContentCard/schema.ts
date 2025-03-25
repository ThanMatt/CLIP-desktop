import * as zod from "zod";

export const schema = zod
  .object({
    content: zod.string().optional(),
    files: zod
      .array(
        zod
          .instanceof(File, {
            message: "Please upload valid files",
          })
          .refine(
            (file) => {
              // :: Check if file is an image
              return file.type.startsWith("image/");
            },
            {
              message: "Only image files are allowed",
            }
          )
      )
      .optional(),
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
    }
  );
export type ShareContentFormData = zod.infer<typeof schema>;

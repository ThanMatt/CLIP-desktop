import {
  AlertCircle,
  CheckCircleIcon,
  ExternalLink,
  FileImage,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Subtle } from "../ui/typography";
import { useEffect, useState } from "react";
import * as zod from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { IpcResponse, Server } from "../../../types";
import { UploadTab } from "../UploadTab";

const schema = zod
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

type ShareContentCardProps = {
  targetServer: Server | null;
};

const ShareContentCard = ({ targetServer }: ShareContentCardProps) => {
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, setActiveTab] = useState("text");

  const methods = useForm<ShareContentFormData>({
    resolver: zodResolver(schema),
  });

  const {
    register,
    formState: { errors, isSubmitSuccessful },
    handleSubmit,
    setError,
    reset,
    watch,
  } = methods;

  const content = watch("content");

  useEffect(() => {
    if (isSubmitSuccessful) {
      reset();
    }
  }, [isSubmitSuccessful, reset]);

  const onSubmit = async (values: ShareContentFormData) => {
    setLoading(true);
    setSuccess(false);
    let response: IpcResponse<any>;

    try {
      if (targetServer) {
        response = await window.api.sendContentToServer({
          content: values.content,
          server: targetServer,
        });
      } else {
        response = await window.api.respondContentToDevice(values.content);
      }

      if (!response.success) {
        setError("root", {
          message: response.message,
        });
        setSuccess(false);
      } else {
        setSuccess(true);
      }
      setLoading(false);
    } catch (error) {
      const message = "There was an error. Please try again.";

      setError("root", {
        message,
      });
      setLoading(false);
    }
  };

  return (
    <Card>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle className="text-lg font-bold font-sans">
              Share content between your devices seamlessly
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue="text"
              className="w-full"
              onValueChange={setActiveTab}
            >
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Text/Link
                </TabsTrigger>
                <TabsTrigger value="image" className="flex items-center gap-2">
                  <FileImage className="h-4 w-4" />
                  Files
                </TabsTrigger>
              </TabsList>
              <TabsContent value="text">
                <Textarea
                  placeholder="Enter text or paste a link to share..."
                  className="min-h-[120px] mb-4"
                  {...register("content")}
                />
              </TabsContent>
              <TabsContent value="image">
                <UploadTab />
              </TabsContent>
            </Tabs>
            {success && (
              <Alert className="mb-4" variant="success">
                <CheckCircleIcon className="h-4 w-4" />
                <AlertTitle>Success!</AlertTitle>
                <AlertDescription>
                  Content has been sent successfully
                </AlertDescription>
              </Alert>
            )}
            {errors.root && (
              <Alert className="mb-4" variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errors.root?.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              disabled={!!errors.content || loading || !content}
              type="submit"
            >
              Send Content {targetServer ? `to ${targetServer.deviceName}` : ""}
            </Button>
          </CardFooter>
        </form>
      </FormProvider>
    </Card>
  );
};

ShareContentCard.displayName = "ShareContentCard";

export default ShareContentCard;

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
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { FilePayload, IpcResponse, Server } from "../../../types";
import { UploadTab } from "../UploadTab";
import { schema, ShareContentFormData } from "./schema";
import { readFileAsArrayBuffer } from "@/lib/utils";

type ShareContentCardProps = {
  targetServer: Server | null;
};

const ShareContentCard = ({ targetServer }: ShareContentCardProps) => {
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("text");

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
    clearErrors,
  } = methods;

  const content = watch("content");
  const files = watch("files") || [];

  useEffect(() => {
    if (isSubmitSuccessful) {
      reset();
    }
  }, [isSubmitSuccessful, reset]);

  useEffect(() => {
    reset();
    clearErrors();
    setSuccess(false);
  }, [activeTab]);

  useEffect(() => {
    let statusTimeout;
    if (success || errors.root) {
      statusTimeout = setTimeout(() => {
        if (success) setSuccess(false);
        if (errors.root) clearErrors("root");
      }, 5000);
    }

    return () => clearTimeout(statusTimeout);
  }, [success, errors.root, clearErrors]);

  const onSubmit = async (values: ShareContentFormData) => {
    setLoading(true);
    setSuccess(false);
    let response: IpcResponse<any>;

    try {
      // :: For CLIP-to-CLIP server transfer
      if (targetServer) {
        response = await window.api.sendContentToServer({
          content: values.content,
          server: targetServer,
        });
      } else {
        // :: For mobile devices (e.g. iOS, android)
        // :: For file transfers
        if (values.files?.length > 0) {
          const filePromises = values.files.map(async (file) => {
            const fileBuffer = await readFileAsArrayBuffer(file);
            return {
              name: file.name,
              path: file.path,
              type: file.type,
              size: file.size,
              data: Array.from(new Uint8Array(fileBuffer)),
            };
          });
          const payload: FilePayload[] = await Promise.all(filePromises);
          response = await window.api.respondFileToDevice({
            fileData: payload,
          });
        } else {
          // :: For text-content transfers
          response = await window.api.respondContentToDevice(values.content);
        }
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

  const submitButtonDisabled = loading || (!content && !files.length);
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
                <div className="space-y-2">
                  <Textarea
                    placeholder="Enter text or paste a link to share..."
                    className="min-h-[120px]"
                    {...register("content")}
                  />
                  {errors.content && (
                    <p className="text-sm text-destructive">
                      {errors.content.message}
                    </p>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="image">
                <div className="space-y-2">
                  <UploadTab />
                </div>
              </TabsContent>
            </Tabs>
            {success && (
              <Alert className="mb-4 mt-4" variant="success">
                <CheckCircleIcon className="h-4 w-4" />
                <AlertTitle>Success!</AlertTitle>
                <AlertDescription>
                  Content has been sent successfully
                </AlertDescription>
              </Alert>
            )}
            {errors.root && (
              <Alert
                className="mb-4 mt-4 bg-destructive-foreground"
                variant="destructive"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errors.root?.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              disabled={submitButtonDisabled}
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

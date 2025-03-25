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
import { IpcResponse, Server } from "../../../types";
import { UploadTab } from "../UploadTab";
import { schema, ShareContentFormData } from "./schema";

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
    console.log("🚀 ~ useEffect ~ isSubmitSuccessful:", isSubmitSuccessful);
    if (isSubmitSuccessful) {
      reset();
    }
  }, [isSubmitSuccessful, reset]);

  useEffect(() => {
    reset();
    clearErrors();
  }, [activeTab]);

  const onSubmit = async (values: ShareContentFormData) => {
    setLoading(true);
    setSuccess(false);
    let response: IpcResponse<any>;
    console.log("🚀 ~ onSubmit ~ values:", values);

    try {
      if (targetServer) {
        response = await window.api.sendContentToServer({
          content: values.content,
          server: targetServer,
        });
      } else {
        if (values.files.length > 0) {
          response = await window.api.respondFileToDevice(values.files);
        } else {
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
      console.log("🚀 ~ onSubmit ~ error:", error);
      const message = "There was an error. Please try again.";

      setError("root", {
        message,
      });
      setLoading(false);
    }
  };

  const submitButtonDisabled = loading || (!content && !Boolean(files.length));
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

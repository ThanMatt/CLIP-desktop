import {
  AlertCircle,
  ArrowUpFromLine,
  CheckCircleIcon,
  ExternalLink,
  FileImage,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
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
import axios, { isAxiosError } from "axios";
import { useForm } from "react-hook-form";
import {Server} from '../../../types'

const schema = zod.object({
  content: zod.string().refine((value) => value.trim().length > 0, {
    message: "This field is required",
  }),
});
type FormData = zod.infer<typeof schema>;

type ShareContentCardProps = {
  targetServer: Server | null;
};

const ShareContentCard = ({ targetServer }: ShareContentCardProps) => {
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, setActiveTab] = useState("text");

  const {
    register,
    formState: { errors, isSubmitSuccessful },
    handleSubmit,
    setError,
    reset,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const content = watch("content");

  useEffect(() => {
    if (isSubmitSuccessful) {
      reset();
    }
  }, [isSubmitSuccessful, reset]);

  const onSubmit = async (values: FormData) => {
    setLoading(true);
    setSuccess(false);

    let server: string;

    if (targetServer) {
      server = `http://${targetServer.ip}:${targetServer.port}`;
    } else {
      server = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
    }

    try {
      await axios.post(
        targetServer ? `${server}/api/text` : `${server}/api/content`,
        axios{
          content: values.content,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      setSuccess(true);
      setLoading(false);
    } catch (error) {
      console.error(error);
      let message = "There was an error";
      if (isAxiosError(error)) {
        message = error?.response
          ? error.response.data.message
          : "There was an error";
      }

      setError("root", {
        message,
      });
      setLoading(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-sans">
            CLIP Client
          </CardTitle>
          <CardDescription>
            Share content between your devices seamlessly
          </CardDescription>
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
              <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors">
                <ArrowUpFromLine className="mx-auto h-12 w-12 text-gray-400 mb-4" />{" "}
                <Subtle>Drag and drop files here, or click to select</Subtle>
              </div>
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
    </Card>
  );
};

ShareContentCard.displayName = "ShareContentCard";

export default ShareContentCard;

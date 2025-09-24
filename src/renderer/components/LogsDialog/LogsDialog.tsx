import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  ArrowUpDown,
  Calendar,
  Download,
  FileText,
  Filter,
  MessageSquare,
  RefreshCw,
  Search,
  Smartphone,
  Trash2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "../ui/pagination";

interface ContentLog {
  id: number;
  timestamp: string;
  type: "sent" | "received" | "declined";
  deviceName: string;
  content: string;
  contentType: "text" | "file";
  status: "success" | "failed" | "declined";
  fileSize?: number;
  fileName?: string;
}

interface LogsFilter {
  type?: "sent" | "received" | "declined";
  deviceName?: string;
  contentType?: "text" | "file";
  limit?: number;
  offset?: number;
}

type LogsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const LogsDialog = ({ open, onOpenChange }: LogsDialogProps) => {
  const [logs, setLogs] = useState<ContentLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10); // Items per page
  const [filter, setFilter] = useState<LogsFilter>({ limit: 10, offset: 0 });
  const [searchDevice, setSearchDevice] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedContentType, setSelectedContentType] = useState<string>("all");

  const fetchLogs = async (page: number = currentPage) => {
    setIsLoading(true);
    try {
      const filterParams: LogsFilter = {
        limit: pageSize,
        offset: (page - 1) * pageSize,
      };

      if (searchDevice) {
        filterParams.deviceName = searchDevice;
      }

      if (selectedType !== "all") {
        filterParams.type = selectedType as "sent" | "received" | "declined";
      }

      if (selectedContentType !== "all") {
        filterParams.contentType = selectedContentType as "text" | "file";
      }

      // Fetch both logs and total count
      const [logsResponse, countResponse] = await Promise.all([
        window.api.getLogs(filterParams),
        window.api.getLogsCount(filterParams),
      ]);

      if (logsResponse.success) {
        setLogs(logsResponse.data);
      }

      if (countResponse.success) {
        setTotalCount(countResponse.data);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllLogs = async () => {
    if (
      confirm(
        "Are you sure you want to clear all logs? This action cannot be undone.",
      )
    ) {
      try {
        const response = await window.api.clearLogs();
        if (response.success) {
          setLogs([]);
          setTotalCount(0);
          setCurrentPage(1);
        }
      } catch (error) {
        console.error("Failed to clear logs:", error);
      }
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchLogs(page);
  };

  const resetToFirstPage = () => {
    setCurrentPage(1);
    fetchLogs(1);
  };

  useEffect(() => {
    if (open) {
      resetToFirstPage();
    }
  }, [open, searchDevice, selectedType, selectedContentType]);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "sent":
        return <Upload className="h-4 w-4 text-blue-500" />;
      case "received":
        return <Download className="h-4 w-4 text-green-500" />;
      case "declined":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getContentTypeIcon = (contentType: string) => {
    return contentType === "file" ? (
      <FileText className="h-4 w-4" />
    ) : (
      <MessageSquare className="h-4 w-4" />
    );
  };

  const truncateContent = (content: string, maxLength = 60) => {
    return content.length > maxLength
      ? content.substring(0, maxLength) + "..."
      : content;
  };

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <PaginationItem key={page}>
          <PaginationLink
            isActive={page === currentPage}
            onClick={() => handlePageChange(page)}
            className="cursor-pointer"
          >
            {page}
          </PaginationLink>
        </PaginationItem>,
      );
    }

    return items;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Activity Logs
          </DialogTitle>
          <DialogDescription>
            View your content transfer history and activity
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Label htmlFor="device-search">Device:</Label>
            <Input
              id="device-search"
              placeholder="Search device..."
              value={searchDevice}
              onChange={(e) => setSearchDevice(e.target.value)}
              className="w-40"
            />
          </div>

          <div className="flex items-center gap-2">
            <Label>Type:</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label>Content:</Label>
            <Select
              value={selectedContentType}
              onValueChange={setSelectedContentType}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Select content" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="file">File</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-auto">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {isLoading ? "Loading logs..." : "No logs found"}
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {getTypeIcon(log.type)}
                    {getContentTypeIcon(log.contentType)}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Smartphone className="h-3 w-3" />
                        <span className="font-medium">{log.deviceName}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>

                      <div className="text-sm text-muted-foreground mt-1">
                        {log.contentType === "file" && log.fileName ? (
                          <span className="font-mono">{log.fileName}</span>
                        ) : (
                          <span className="font-mono">
                            {truncateContent(log.content)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full capitalize ${
                        log.type === "sent"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                          : log.type === "received"
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                      }`}
                    >
                      {log.type}
                    </span>

                    <span
                      className={`px-2 py-1 text-xs rounded-full capitalize ${
                        log.status === "success"
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-2">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, totalCount)} of {totalCount}{" "}
              entries
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    className={`cursor-pointer ${!hasPreviousPage ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() =>
                      hasPreviousPage && handlePageChange(currentPage - 1)
                    }
                  />
                </PaginationItem>

                {currentPage > 3 && (
                  <>
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => handlePageChange(1)}
                        className="cursor-pointer"
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>
                    {currentPage > 4 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                  </>
                )}

                {renderPaginationItems()}

                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => handlePageChange(totalPages)}
                        className="cursor-pointer"
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}

                <PaginationItem>
                  <PaginationNext
                    className={`cursor-pointer ${!hasNextPage ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() =>
                      hasNextPage && handlePageChange(currentPage + 1)
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <Button variant="destructive" onClick={clearAllLogs} size="sm">
            <Trash2 className="h-4 w-4 mr-1" />
            Clear All Logs
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LogsDialog;


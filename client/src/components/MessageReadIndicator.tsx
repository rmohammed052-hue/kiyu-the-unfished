import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageReadIndicatorProps {
  isRead: boolean;
  isSent: boolean;
  className?: string;
}

export default function MessageReadIndicator({ isRead, isSent, className }: MessageReadIndicatorProps) {
  if (!isSent) return null;

  return (
    <div className={cn("inline-flex items-center", className)} data-testid="message-read-indicator">
      {isRead ? (
        <CheckCheck 
          className="h-4 w-4 text-blue-500" 
          data-testid="icon-message-read"
          strokeWidth={2.5}
        />
      ) : (
        <Check 
          className="h-4 w-4 text-gray-400 dark:text-gray-500" 
          data-testid="icon-message-sent"
          strokeWidth={2.5}
        />
      )}
    </div>
  );
}

import { cn } from "@/lib/utils";
import { Ban } from "lucide-react";

interface BanStatusBadgeProps {
  banStatus: "Forbidden" | "Limited" | "Semi-Limited" | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function BanStatusBadge({
  banStatus,
  className,
  size = "md",
}: BanStatusBadgeProps) {
  if (!banStatus) return null;

  const sizeClasses = {
    sm: "w-5 h-5 text-xs",
    md: "w-6 h-6 text-sm",
    lg: "w-8 h-8 text-base",
  };

  const iconSizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  if (banStatus === "Forbidden") {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-red-600 text-white shadow-lg border-2 border-white",
          sizeClasses[size],
          className
        )}
      >
        <Ban className={iconSizeClasses[size]} strokeWidth={3} />
      </div>
    );
  }

  const number = banStatus === "Limited" ? "1" : "2";
  const bgColor = banStatus === "Limited" ? "bg-red-600" : "bg-yellow-500";

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full text-white font-bold shadow-lg border-2 border-white",
        sizeClasses[size],
        bgColor,
        className
      )}
    >
      {number}
    </div>
  );
}

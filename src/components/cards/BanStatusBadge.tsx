import { cn } from "@/lib/utils";
import { Ban } from "lucide-react";

interface BanStatusBadgeProps {
  banStatus: "Banned" | "Limited" | "Semi-Limited" | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function BanStatusBadge({ banStatus, className, size = "md" }: BanStatusBadgeProps) {
  if (!banStatus) return null;

  const sizeClasses = {
    sm: "w-4 h-4 text-[10px]",
    md: "w-5 h-5 text-xs",
    lg: "w-6 h-6 text-sm",
  };

  const iconSizeClasses = {
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  if (banStatus === "Banned") {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-red-600 text-white shadow-md",
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
        "flex items-center justify-center rounded-full text-white font-bold shadow-md",
        sizeClasses[size],
        bgColor,
        className
      )}
    >
      {number}
    </div>
  );
}

import { useState } from "react";
import { YugiohCard } from "@/types/card";
import { cn } from "@/lib/utils";
import { ImageOff } from "lucide-react";
import { BanStatusBadge } from "./BanStatusBadge";
import { useBanList } from "@/hooks/useBanList";

interface CardImageProps {
  card: YugiohCard;
  size?: "sm" | "md" | "lg" | "full";
  className?: string;
  showHover?: boolean;
  onClick?: () => void;
}

const sizeClasses = {
  sm: "w-16 h-23",
  md: "w-24 h-35",
  lg: "w-32 h-47",
  full: "w-full h-auto",
};

export function CardImage({
  card,
  size = "md",
  className,
  showHover = false,
  onClick,
}: CardImageProps) {
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);
  const { getBanStatus } = useBanList();

  const imageUrl =
    card.card_images?.[0]?.image_url_small || card.card_images?.[0]?.image_url;
  const banStatus = getBanStatus(card.id);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted aspect-[59/86]",
        sizeClasses[size],
        showHover &&
          "cursor-pointer transition-transform hover:scale-105 hover:shadow-lg",
        className
      )}
      onClick={onClick}
    >
      {banStatus && (
        <div className="absolute top-0.5 right-0.5 z-10">
          <BanStatusBadge 
            banStatus={banStatus} 
            size={size === "sm" ? "sm" : size === "md" ? "md" : "lg"}
          />
        </div>
      )}

      {loading && !imageError && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}

      {imageError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground">
          <ImageOff className="h-6 w-6" />
          <span className="text-xs text-center px-1 line-clamp-2">
            {card.name}
          </span>
        </div>
      ) : (
        <img
          src={imageUrl}
          alt={card.name}
          className={cn(
            "w-full h-full object-cover transition-opacity",
            loading ? "opacity-0" : "opacity-100"
          )}
          onLoad={() => setLoading(false)}
          onError={() => {
            setImageError(true);
            setLoading(false);
          }}
          loading="lazy"
        />
      )}
    </div>
  );
}

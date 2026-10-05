import { useState } from "react";
import { cn } from "@/lib/utils";

// Official orb artwork lives in public/ (DARK.svg … WIND.svg).
const KNOWN_ATTRIBUTES = new Set([
  "DARK",
  "DIVINE",
  "EARTH",
  "FIRE",
  "LIGHT",
  "WATER",
  "WIND",
]);

const SIZE_CLASSES = {
  sm: "h-5 w-5",
  md: "h-7 w-7",
  lg: "h-9 w-9",
} as const;

interface AttributeOrbProps {
  attribute: string;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}

/**
 * Attribute orb rendered from the official SVGs in public/.
 * BASE_URL prefix keeps it working under the GitHub Pages subpath.
 */
export function AttributeOrb({ attribute, size = "md", className }: AttributeOrbProps) {
  const [failed, setFailed] = useState(false);

  if (!KNOWN_ATTRIBUTES.has(attribute) || failed) {
    return (
      <span
        role="img"
        aria-label={attribute}
        title={attribute}
        className={cn(
          "inline-flex shrink-0 select-none items-center justify-center rounded-full bg-muted font-mono text-[10px] font-bold text-muted-foreground ring-1 ring-black/10",
          SIZE_CLASSES[size],
          className
        )}
      >
        ?
      </span>
    );
  }

  return (
    <img
      src={`${import.meta.env.BASE_URL}${attribute}.svg`}
      alt={attribute}
      title={attribute}
      draggable={false}
      onError={() => setFailed(true)}
      className={cn(
        "shrink-0 select-none rounded-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]",
        SIZE_CLASSES[size],
        className
      )}
    />
  );
}

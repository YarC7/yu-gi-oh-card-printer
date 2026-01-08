import { useState, useEffect, useRef, useCallback, memo } from "react";
import { YugiohCard } from "@/types/card";
import { CardImage } from "./CardImage";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface VirtualizedCardGridProps {
  cards: YugiohCard[];
  onCardClick?: (card: YugiohCard) => void;
  onAddCard?: (card: YugiohCard) => void;
  className?: string;
}

const CARD_HEIGHT = 140; // Approximate height of each card
const CARD_WIDTH = 100; // Approximate width of each card
const GAP = 8; // Gap between cards

export const VirtualizedCardGrid = memo<VirtualizedCardGridProps>(
  function VirtualizedCardGrid({
    cards,
    onCardClick,
    onAddCard,
    className,
  }: VirtualizedCardGridProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
    const [containerHeight, setContainerHeight] = useState(0);

    // Calculate how many cards fit in a row based on container width
    const getCardsPerRow = useCallback((containerWidth: number) => {
      return Math.max(
        1,
        Math.floor((containerWidth + GAP) / (CARD_WIDTH + GAP))
      );
    }, []);

    // Calculate visible range based on scroll position
    const updateVisibleRange = useCallback(() => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const containerWidth = container.clientWidth;

      const cardsPerRow = getCardsPerRow(containerWidth);
      const rowHeight = CARD_HEIGHT + GAP;

      const startRow = Math.floor(scrollTop / rowHeight);
      const endRow = Math.ceil((scrollTop + containerHeight) / rowHeight);

      const start = Math.max(0, startRow * cardsPerRow);
      const end = Math.min(cards.length, (endRow + 2) * cardsPerRow); // Add buffer

      setVisibleRange({ start, end });
    }, [cards.length, getCardsPerRow]);

    // Update container height and visible range when cards change
    useEffect(() => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const cardsPerRow = getCardsPerRow(containerWidth);
      const totalRows = Math.ceil(cards.length / cardsPerRow);
      const totalHeight = totalRows * (CARD_HEIGHT + GAP);

      setContainerHeight(totalHeight);
      updateVisibleRange();
    }, [cards.length, getCardsPerRow, updateVisibleRange]);

    // Handle scroll events
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const handleScroll = () => updateVisibleRange();
      container.addEventListener("scroll", handleScroll, { passive: true });

      return () => container.removeEventListener("scroll", handleScroll);
    }, [updateVisibleRange]);

    // Handle resize events
    useEffect(() => {
      const handleResize = () => updateVisibleRange();
      window.addEventListener("resize", handleResize);

      return () => window.removeEventListener("resize", handleResize);
    }, [updateVisibleRange]);

    const handleDragStart = useCallback(
      (e: React.DragEvent, card: YugiohCard) => {
        e.dataTransfer.setData("application/json", JSON.stringify(card));
        e.dataTransfer.effectAllowed = "copy";
      },
      []
    );

    if (cards.length === 0) {
      return (
        <div className={cn("flex-1 overflow-auto", className)}>
          <div className="py-12 text-center text-sm text-muted-foreground">
            Không có kết quả
          </div>
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className={cn("flex-1 overflow-auto", className)}
        style={{ height: "100%" }}
      >
        <div style={{ height: containerHeight, position: "relative" }}>
          {cards
            .slice(visibleRange.start, visibleRange.end)
            .map((card, index) => {
              const actualIndex = visibleRange.start + index;
              const cardsPerRow = getCardsPerRow(
                containerRef.current?.clientWidth || 400
              );
              const row = Math.floor(actualIndex / cardsPerRow);
              const col = actualIndex % cardsPerRow;

              return (
                <div
                  key={card.id}
                  className="absolute cursor-grab active:cursor-grabbing"
                  style={{
                    left: col * (CARD_WIDTH + GAP),
                    top: row * (CARD_HEIGHT + GAP),
                    width: CARD_WIDTH,
                    height: CARD_HEIGHT,
                  }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, card)}
                  onClick={() => onCardClick?.(card)}
                  onDoubleClick={() => onAddCard?.(card)}
                >
                  <div className="relative group w-full h-full">
                    <CardImage card={card} size="full" showHover />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="bg-background/80 rounded-full p-1">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    );
  }
);

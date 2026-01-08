import { DeckCard, YugiohCard } from '@/types/card';
import { CardImage } from '@/components/cards/CardImage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeckSectionProps {
  title: string;
  section: 'main' | 'extra' | 'side';
  cards: DeckCard[];
  maxCount?: number;
  onRemoveCard: (cardId: number, section: 'main' | 'extra' | 'side') => void;
  onCardClick?: (card: YugiohCard) => void;
  onDrop: (card: YugiohCard, section: 'main' | 'extra' | 'side') => void;
  className?: string;
}

export function DeckSection({
  title,
  section,
  cards,
  maxCount,
  onRemoveCard,
  onCardClick,
  onDrop,
  className,
}: DeckSectionProps) {
  const count = cards.reduce((sum, c) => sum + c.quantity, 0);
  const isOverLimit = maxCount !== undefined && count > maxCount;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const cardData = e.dataTransfer.getData('application/json');
    if (cardData) {
      try {
        const card = JSON.parse(cardData) as YugiohCard;
        onDrop(card, section);
      } catch (err) {
        console.error('Invalid drop data:', err);
      }
    }
  };

  return (
    <div
      className={cn(
        'space-y-2 p-3 rounded-lg border-2 border-dashed transition-colors',
        'hover:border-primary/50 hover:bg-primary/5',
        className
      )}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">{title}</h3>
        <Badge
          variant={isOverLimit ? 'destructive' : 'secondary'}
          className="text-xs"
        >
          {count}{maxCount ? `/${maxCount}` : ''}
        </Badge>
      </div>

      {cards.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Kéo thả bài vào đây
        </div>
      ) : (
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-8 xl:grid-cols-10 gap-1">
          {cards.map((deckCard) => (
            <div key={deckCard.card.id} className="relative group">
              <CardImage
                card={deckCard.card}
                size="full"
                showHover
                onClick={() => onCardClick?.(deckCard.card)}
              />
              {deckCard.quantity > 1 && (
                <Badge className="absolute top-0.5 right-0.5 h-5 min-w-5 text-xs px-1">
                  x{deckCard.quantity}
                </Badge>
              )}
              <Button
                size="icon"
                variant="destructive"
                className="absolute bottom-0.5 right-0.5 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveCard(deckCard.card.id, section);
                }}
              >
                <Minus className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { YugiohCard } from '@/types/card';
import { CardImage } from './CardImage';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CardGridProps {
  cards: YugiohCard[];
  onCardClick?: (card: YugiohCard) => void;
  onAddCard?: (card: YugiohCard) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function CardGrid({ 
  cards, 
  onCardClick, 
  onAddCard,
  loading, 
  emptyMessage = 'Không tìm thấy bài nào',
  className 
}: CardGridProps) {
  if (loading) {
    return (
      <div className={cn('grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2', className)}>
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[59/86] rounded-md bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2', className)}>
      {cards.map((card) => (
        <div key={card.id} className="relative group">
          <CardImage
            card={card}
            size="full"
            showHover
            onClick={() => onCardClick?.(card)}
          />
          {onAddCard && (
            <Button
              size="icon"
              variant="secondary"
              className="absolute bottom-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onAddCard(card);
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

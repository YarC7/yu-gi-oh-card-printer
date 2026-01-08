import { DeckCard, YugiohCard } from '@/types/card';
import { CardImage } from '@/components/cards/CardImage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Minus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeckPreviewProps {
  cards: DeckCard[];
  onRemoveCard: (cardId: number, section: 'main' | 'extra' | 'side') => void;
  onCardClick?: (card: YugiohCard) => void;
  className?: string;
}

export function DeckPreview({ cards, onRemoveCard, onCardClick, className }: DeckPreviewProps) {
  const mainDeck = cards.filter((c) => c.section === 'main');
  const extraDeck = cards.filter((c) => c.section === 'extra');
  const sideDeck = cards.filter((c) => c.section === 'side');

  const mainCount = mainDeck.reduce((sum, c) => sum + c.quantity, 0);
  const extraCount = extraDeck.reduce((sum, c) => sum + c.quantity, 0);
  const sideCount = sideDeck.reduce((sum, c) => sum + c.quantity, 0);

  const renderSection = (
    title: string,
    sectionCards: DeckCard[],
    count: number,
    section: 'main' | 'extra' | 'side'
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">{title}</h3>
        <Badge variant="secondary" className="text-xs">
          {count}
        </Badge>
      </div>
      {sectionCards.length === 0 ? (
        <div className="py-4 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
          Chưa có bài
        </div>
      ) : (
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-1">
          {sectionCards.map((deckCard) => (
            <div key={deckCard.card.id} className="relative group">
              <CardImage
                card={deckCard.card}
                size="full"
                showHover
                onClick={() => onCardClick?.(deckCard.card)}
              />
              {deckCard.quantity > 1 && (
                <Badge
                  className="absolute top-0.5 right-0.5 h-5 min-w-5 text-xs px-1"
                >
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

  return (
    <div className={cn('space-y-4', className)}>
      {renderSection('Main Deck', mainDeck, mainCount, 'main')}
      {renderSection('Extra Deck', extraDeck, extraCount, 'extra')}
      {renderSection('Side Deck', sideDeck, sideCount, 'side')}
    </div>
  );
}

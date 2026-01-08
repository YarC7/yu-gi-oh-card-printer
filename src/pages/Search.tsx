import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { CardSearchFilters } from '@/components/cards/CardSearchFilters';
import { CardGrid } from '@/components/cards/CardGrid';
import { CardDetailModal } from '@/components/cards/CardDetailModal';
import { searchCards } from '@/lib/ygoprodeck-api';
import { searchCustomCards } from '@/lib/custom-cards-service';
import { YugiohCard, CardSearchFilters as Filters, DeckCard } from '@/types/card';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowRight } from 'lucide-react';

export default function Search() {
  const [cards, setCards] = useState<YugiohCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState<YugiohCard | null>(null);
  const [selectedCards, setSelectedCards] = useState<YugiohCard[]>([]);
  const navigate = useNavigate();

  const handleSearch = async (filters: Filters) => {
    setLoading(true);
    try {
      // Search both YGOPRODeck API and custom cards in parallel
      const [apiResults, customResults] = await Promise.all([
        searchCards(filters),
        searchCustomCards(filters.name),
      ]);
      
      // Merge results - custom cards first (they're pre-release/custom)
      const allResults = [...customResults, ...apiResults];
      setCards(allResults);
      
      if (allResults.length === 0) {
        toast.info('Không tìm thấy bài phù hợp');
      } else if (customResults.length > 0) {
        toast.success(`Tìm thấy ${customResults.length} bài custom + ${apiResults.length} bài từ database`);
      }
    } catch (error) {
      toast.error('Có lỗi khi tìm kiếm');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = (card: YugiohCard) => {
    setSelectedCards(prev => [...prev, card]);
    toast.success(`Đã thêm ${card.name}`);
  };

  const handleGoToDeckBuilder = () => {
    if (selectedCards.length === 0) {
      toast.error('Chưa chọn bài nào');
      return;
    }

    // Group cards and create deck format
    const cardCounts = new Map<number, { card: YugiohCard; count: number }>();
    selectedCards.forEach(card => {
      const existing = cardCounts.get(card.id);
      if (existing) {
        existing.count++;
      } else {
        cardCounts.set(card.id, { card, count: 1 });
      }
    });

    const deckCards: DeckCard[] = [];
    cardCounts.forEach(({ card, count }) => {
      // Determine section based on card type
      let section: 'main' | 'extra' | 'side' = 'main';
      const type = card.type.toLowerCase();
      if (type.includes('fusion') || type.includes('synchro') || type.includes('xyz') || type.includes('link')) {
        section = 'extra';
      }
      deckCards.push({ card, quantity: Math.min(count, 3), section });
    });

    sessionStorage.setItem('importedDeck', JSON.stringify({
      parsed: { main: [], extra: [], side: [] },
      cards: selectedCards,
      deckCards,
    }));
    
    navigate('/deck-builder');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Tìm kiếm bài</h1>
            {selectedCards.length > 0 && (
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="gap-1">
                  <ShoppingCart className="h-3 w-3" />
                  {selectedCards.length} bài đã chọn
                </Badge>
                <Button size="sm" onClick={handleGoToDeckBuilder}>
                  Đến Deck Builder
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
          
          <CardSearchFilters onSearch={handleSearch} loading={loading} />
          
          <CardGrid
            cards={cards}
            loading={loading}
            onCardClick={setSelectedCard}
            onAddCard={handleAddCard}
            emptyMessage="Nhập tên bài hoặc sử dụng bộ lọc để tìm kiếm"
          />
        </div>
      </main>

      <CardDetailModal
        card={selectedCard}
        open={!!selectedCard}
        onOpenChange={(open) => !open && setSelectedCard(null)}
        onAddCard={handleAddCard}
      />
    </div>
  );
}

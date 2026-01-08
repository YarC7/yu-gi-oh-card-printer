import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { CardSearchFilters } from '@/components/cards/CardSearchFilters';
import { CardGrid } from '@/components/cards/CardGrid';
import { CardDetailModal } from '@/components/cards/CardDetailModal';
import { searchCards } from '@/lib/ygoprodeck-api';
import { YugiohCard, CardSearchFilters as Filters } from '@/types/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function Search() {
  const [cards, setCards] = useState<YugiohCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState<YugiohCard | null>(null);
  const navigate = useNavigate();

  const handleSearch = async (filters: Filters) => {
    setLoading(true);
    try {
      const results = await searchCards(filters);
      setCards(results);
      if (results.length === 0) {
        toast.info('Không tìm thấy bài phù hợp');
      }
    } catch (error) {
      toast.error('Có lỗi khi tìm kiếm');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = (card: YugiohCard) => {
    const existing = sessionStorage.getItem('deckCards');
    const deckCards = existing ? JSON.parse(existing) : [];
    deckCards.push(card);
    sessionStorage.setItem('deckCards', JSON.stringify(deckCards));
    toast.success(`Đã thêm ${card.name}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Tìm kiếm bài</h1>
          
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

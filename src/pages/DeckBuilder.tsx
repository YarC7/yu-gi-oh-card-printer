import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { DeckBuilderLayout } from '@/components/deck/DeckBuilderLayout';
import { AddCustomCardModal } from '@/components/cards/AddCustomCardModal';
import { useDeck } from '@/hooks/useDeck';
import { useAuth } from '@/hooks/useAuth';
import { DEFAULT_EXPORT_SETTINGS, ExportSettings as Settings, YugiohCard, DeckCard } from '@/types/card';
import { saveDeck, updateDeck, saveGenerationHistory } from '@/lib/deck-service';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Trash2, Save, PlusCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Link } from 'react-router-dom';

export default function DeckBuilder() {
  const { user } = useAuth();
  const { deck, setDeckName, addCard, removeCard, setCards, clearDeck, getAllCardsFlat, getTotalCardCount, loadDeck } = useDeck();
  const [settings, setSettings] = useState<Settings>(DEFAULT_EXPORT_SETTINGS);
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentDeckId, setCurrentDeckId] = useState<string | null>(null);
  const [showCustomCardModal, setShowCustomCardModal] = useState(false);

  useEffect(() => {
    const imported = sessionStorage.getItem('importedDeck');
    if (imported) {
      const { parsed, cards } = JSON.parse(imported) as { parsed: { main: number[], extra: number[], side: number[] }, cards: YugiohCard[] };
      const cardMap = new Map(cards.map(c => [c.id, c]));
      
      const deckCards: DeckCard[] = [];
      
      const addToDeck = (ids: number[], section: 'main' | 'extra' | 'side') => {
        const counts = new Map<number, number>();
        ids.forEach(id => counts.set(id, (counts.get(id) || 0) + 1));
        counts.forEach((qty, id) => {
          const card = cardMap.get(id);
          if (card) deckCards.push({ card, quantity: qty, section });
        });
      };
      
      addToDeck(parsed.main, 'main');
      addToDeck(parsed.extra, 'extra');
      addToDeck(parsed.side, 'side');
      
      setCards(deckCards);
      sessionStorage.removeItem('importedDeck');
      
      const notFoundRaw = sessionStorage.getItem('notFoundCardIds');
      if (notFoundRaw) {
        const notFoundIds = JSON.parse(notFoundRaw) as number[];
        if (notFoundIds.length > 0) {
          toast.warning(
            `${notFoundIds.length} bài không tìm thấy trong database (có thể là bài pre-release)`,
            {
              description: `ID: ${notFoundIds.slice(0, 5).join(', ')}${notFoundIds.length > 5 ? '...' : ''}`,
              duration: 10000,
            }
          );
        }
        sessionStorage.removeItem('notFoundCardIds');
      }
    }
  }, [setCards]);

  const handleSaveDeck = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để lưu deck');
      return;
    }

    if (deck.cards.length === 0) {
      toast.error('Deck trống');
      return;
    }

    setSaving(true);
    try {
      if (currentDeckId) {
        const success = await updateDeck(currentDeckId, deck);
        if (success) {
          toast.success('Đã cập nhật deck!');
        } else {
          toast.error('Có lỗi khi cập nhật');
        }
      } else {
        const result = await saveDeck(deck, user.id);
        if (result) {
          setCurrentDeckId(result.id);
          toast.success('Đã lưu deck!');
        } else {
          toast.error('Có lỗi khi lưu');
        }
      }
    } finally {
      setSaving(false);
    }
  };

  // Helper to load image as base64
  const loadImageAsBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        } else {
          reject(new Error('Canvas context not available'));
        }
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = url;
    });
  };

  const handleExport = async () => {
    const cards = getAllCardsFlat();
    if (cards.length === 0) {
      toast.error('Deck trống');
      return;
    }

    setExporting(true);
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'cm', format: 'a4' });
      const cardW = settings.cardWidth;
      const cardH = settings.cardHeight;
      const margin = 1;
      const gap = 0.2;
      
      let x = margin;
      let y = margin;
      let col = 0;

      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const imgUrl = card.card_images[0]?.image_url;
        
        if (imgUrl) {
          try {
            const base64 = await loadImageAsBase64(imgUrl);
            pdf.addImage(base64, 'JPEG', x, y, cardW, cardH);
          } catch {
            pdf.setFillColor(200, 200, 200);
            pdf.rect(x, y, cardW, cardH, 'F');
            pdf.setFontSize(8);
            pdf.setTextColor(100);
            pdf.text(card.name.substring(0, 15), x + 0.2, y + cardH / 2);
          }
        }

        col++;
        if (col >= 3) {
          col = 0;
          x = margin;
          y += cardH + gap;
          
          if (y + cardH > 29.7 - margin && i < cards.length - 1) {
            pdf.addPage();
            y = margin;
          }
        } else {
          x += cardW + gap;
        }
      }

      pdf.save(`${deck.name || 'deck'}.pdf`);
      
      if (user) {
        await saveGenerationHistory(
          user.id,
          deck.name,
          cards.length,
          settings.format,
          currentDeckId || undefined
        );
      }
      
      toast.success('Đã xuất file PDF!');
    } catch (error) {
      toast.error('Có lỗi khi xuất file');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="container py-4 flex-1 flex flex-col">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <Input
              value={deck.name}
              onChange={(e) => setDeckName(e.target.value)}
              className="text-lg font-semibold w-auto max-w-[200px] h-9"
              placeholder="Tên deck"
            />
            {currentDeckId && (
              <span className="text-xs text-muted-foreground">Đã lưu</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowCustomCardModal(true)}
            >
              <PlusCircle className="h-4 w-4 mr-1.5" />
              Thêm bài custom
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSaveDeck}
              disabled={saving || !user}
            >
              <Save className="h-4 w-4 mr-1.5" />
              {saving ? 'Đang lưu...' : 'Lưu'}
            </Button>
            <Button variant="outline" size="sm" onClick={clearDeck}>
              <Trash2 className="h-4 w-4 mr-1.5" />
              Xóa
            </Button>
          </div>
        </div>

        {!user && (
          <div className="mb-4 p-3 bg-muted rounded-lg text-sm text-muted-foreground">
            <Link to="/auth" className="text-primary hover:underline">Đăng nhập</Link> để lưu deck và xem lịch sử
          </div>
        )}

        {/* Main Layout */}
        <DeckBuilderLayout
          cards={deck.cards}
          settings={settings}
          onSettingsChange={setSettings}
          onExport={handleExport}
          exporting={exporting}
          onAddCard={addCard}
          onRemoveCard={removeCard}
          getTotalCardCount={getTotalCardCount}
        />
      </main>

      <AddCustomCardModal
        open={showCustomCardModal}
        onOpenChange={setShowCustomCardModal}
        onAddCard={addCard}
      />
    </div>
  );
}

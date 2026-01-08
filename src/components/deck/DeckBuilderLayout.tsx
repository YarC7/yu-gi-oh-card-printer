import { useState } from 'react';
import { DeckCard, YugiohCard, ExportSettings as Settings } from '@/types/card';
import { DeckSection } from './DeckSection';
import { CardSearchPanel } from './CardSearchPanel';
import { ExportSettings } from '@/components/export/ExportSettings';
import { CardDetailModal } from '@/components/cards/CardDetailModal';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FileDown, Settings2 } from 'lucide-react';

interface DeckBuilderLayoutProps {
  cards: DeckCard[];
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
  onExport: () => void;
  exporting: boolean;
  onAddCard: (card: YugiohCard, section: 'main' | 'extra' | 'side') => void;
  onRemoveCard: (cardId: number, section: 'main' | 'extra' | 'side') => void;
  getTotalCardCount: () => number;
}

export function DeckBuilderLayout({
  cards,
  settings,
  onSettingsChange,
  onExport,
  exporting,
  onAddCard,
  onRemoveCard,
  getTotalCardCount,
}: DeckBuilderLayoutProps) {
  const [selectedCard, setSelectedCard] = useState<YugiohCard | null>(null);

  const mainDeck = cards.filter((c) => c.section === 'main');
  const extraDeck = cards.filter((c) => c.section === 'extra');
  const sideDeck = cards.filter((c) => c.section === 'side');

  // Auto-determine section based on card type
  const determineSection = (card: YugiohCard): 'main' | 'extra' | 'side' => {
    const type = card.type.toLowerCase();
    if (
      type.includes('fusion') ||
      type.includes('synchro') ||
      type.includes('xyz') ||
      type.includes('link')
    ) {
      return 'extra';
    }
    return 'main';
  };

  const handleDrop = (card: YugiohCard, section: 'main' | 'extra' | 'side') => {
    onAddCard(card, section);
  };

  const handleQuickAdd = (card: YugiohCard) => {
    const section = determineSection(card);
    onAddCard(card, section);
  };

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-4 h-[calc(100vh-180px)]">
      {/* Left: Deck Sections */}
      <div className="flex flex-col gap-3 overflow-auto">
        <DeckSection
          title="Main Deck"
          section="main"
          cards={mainDeck}
          maxCount={60}
          onRemoveCard={onRemoveCard}
          onCardClick={setSelectedCard}
          onDrop={handleDrop}
        />
        <DeckSection
          title="Extra Deck"
          section="extra"
          cards={extraDeck}
          maxCount={15}
          onRemoveCard={onRemoveCard}
          onCardClick={setSelectedCard}
          onDrop={handleDrop}
        />
        <DeckSection
          title="Side Deck"
          section="side"
          cards={sideDeck}
          maxCount={15}
          onRemoveCard={onRemoveCard}
          onCardClick={setSelectedCard}
          onDrop={handleDrop}
        />
      </div>

      {/* Right: Search + Export */}
      <div className="flex flex-col gap-3 border-l pl-4">
        {/* Search Panel */}
        <div className="flex-1 min-h-0">
          <CardSearchPanel
            onCardClick={setSelectedCard}
            onAddCard={handleQuickAdd}
          />
        </div>

        {/* Export Settings Accordion */}
        <Accordion type="single" collapsible className="border-t pt-2">
          <AccordionItem value="export" className="border-none">
            <AccordionTrigger className="py-2 hover:no-underline">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileDown className="h-4 w-4" />
                Xuất file ({getTotalCardCount()} bài)
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ExportSettings
                settings={settings}
                onSettingsChange={onSettingsChange}
                onExport={onExport}
                loading={exporting}
                cardCount={getTotalCardCount()}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Card Detail Modal */}
      <CardDetailModal
        card={selectedCard}
        open={!!selectedCard}
        onOpenChange={(open) => !open && setSelectedCard(null)}
        onAddCard={handleQuickAdd}
      />
    </div>
  );
}

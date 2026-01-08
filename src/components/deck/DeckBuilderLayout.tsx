import { useState } from "react";
import { DeckCard, YugiohCard } from "@/types/card";
import { DeckSection } from "./DeckSection";
import { CardSearchPanel } from "./CardSearchPanel";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { toast } from "sonner";

interface DeckBuilderLayoutProps {
  cards: DeckCard[];
  onAddCard: (card: YugiohCard, section: "main" | "extra" | "side") => void;
  onRemoveCard: (cardId: number, section: "main" | "extra" | "side") => void;
  getTotalCardCount: () => number;
}

// Check if card is an Extra Deck monster (Fusion, Synchro, XYZ, Link)
const isExtraDeckMonster = (card: YugiohCard): boolean => {
  const type = card.type.toLowerCase();
  return (
    type.includes("fusion") ||
    type.includes("synchro") ||
    type.includes("xyz") ||
    type.includes("link")
  );
};

export function DeckBuilderLayout({
  cards,
  onAddCard,
  onRemoveCard,
  getTotalCardCount,
}: DeckBuilderLayoutProps) {
  const [selectedCard, setSelectedCard] = useState<YugiohCard | null>(null);
  const [showSearchSheet, setShowSearchSheet] = useState(false);

  const mainDeck = cards.filter((c) => c.section === "main");
  const extraDeck = cards.filter((c) => c.section === "extra");
  const sideDeck = cards.filter((c) => c.section === "side");

  const mainDeckCount = mainDeck.reduce((sum, c) => sum + c.quantity, 0);
  const extraDeckCount = extraDeck.reduce((sum, c) => sum + c.quantity, 0);
  const sideDeckCount = sideDeck.reduce((sum, c) => sum + c.quantity, 0);

  const handleDrop = (card: YugiohCard, section: "main" | "extra" | "side") => {
    onAddCard(card, section);
  };

  // Smart quick add with overflow to side deck
  const handleQuickAdd = (card: YugiohCard) => {
    const isExtra = isExtraDeckMonster(card);

    if (isExtra) {
      // Extra deck monster
      if (extraDeckCount < 15) {
        onAddCard(card, "extra");
      } else if (sideDeckCount < 15) {
        onAddCard(card, "side");
        toast.info("Extra Deck đầy, đã thêm vào Side Deck");
      } else {
        toast.error("Extra Deck và Side Deck đã đầy");
      }
    } else {
      // Main deck card
      if (mainDeckCount < 60) {
        onAddCard(card, "main");
      } else if (sideDeckCount < 15) {
        onAddCard(card, "side");
        toast.info("Main Deck đầy, đã thêm vào Side Deck");
      } else {
        toast.error("Main Deck và Side Deck đã đầy");
      }
    }
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-[1fr_480px] gap-4 flex-1 min-h-0">
      {/* Left: Deck Sections */}
      <div className="flex flex-col gap-3 overflow-auto min-h-0">
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

      {/* Right: Search Panel - Desktop */}
      <div className="hidden lg:flex flex-col gap-3 border-l pl-4 min-h-0">
        {/* Search Panel */}
        <div className="flex-1 min-h-0">
          <CardSearchPanel
            onCardClick={setSelectedCard}
            onAddCard={handleQuickAdd}
          />
        </div>
      </div>

      {/* Mobile: Floating search button + Sheet */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <Sheet open={showSearchSheet} onOpenChange={setShowSearchSheet}>
          <SheetTrigger asChild>
            <Button size="lg" className="rounded-full h-14 w-14 shadow-lg">
              <Search className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
            <SheetHeader className="pb-2">
              <SheetTitle>Tìm kiếm bài</SheetTitle>
            </SheetHeader>
            <div className="h-[calc(100%-50px)] overflow-auto">
              <CardSearchPanel
                onCardClick={(card) => {
                  setSelectedCard(card);
                }}
                onAddCard={(card) => {
                  handleQuickAdd(card);
                }}
              />
            </div>
          </SheetContent>
        </Sheet>
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

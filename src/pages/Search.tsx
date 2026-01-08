import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { CardSearchFilters } from "@/components/cards/CardSearchFilters";
import { CardGrid } from "@/components/cards/CardGrid";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import { searchCards } from "@/lib/ygoprodeck-api";
import { searchCustomCards } from "@/lib/custom-cards-service";
import {
  YugiohCard,
  CardSearchFilters as Filters,
  DeckCard,
} from "@/types/card";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { useBanList } from "@/hooks/useBanList";
import { SEO } from "@/components/seo/SEO";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function Search() {
  const [cards, setCards] = useState<YugiohCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState<YugiohCard | null>(null);
  const [selectedCards, setSelectedCards] = useState<YugiohCard[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [lastFilters, setLastFilters] = useState<Filters | null>(null);
  const navigate = useNavigate();
  const { format, setFormat } = useBanList();

  const handleSearch = async (filters: Filters, page: number = 1) => {
    setLoading(true);
    try {
      // Search both YGOPRODeck API and custom cards in parallel
      const [apiResults, customResults] = await Promise.all([
        searchCards(filters, page),
        searchCustomCards(filters.name),
      ]);

      // Merge results - custom cards first (they're pre-release/custom)
      const allResults = [...customResults, ...apiResults.cards];
      setCards(allResults);
      setTotalCount(apiResults.totalCount + customResults.length);
      setHasMore(apiResults.hasMore);
      setLastFilters(filters);
      setCurrentPage(page);

      if (allResults.length === 0) {
        toast.info("Không tìm thấy bài phù hợp");
      } else if (customResults.length > 0) {
        toast.success(
          `Tìm thấy ${customResults.length} bài custom + ${apiResults.cards.length} bài từ database`
        );
      }
    } catch (error) {
      toast.error("Có lỗi khi tìm kiếm");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (lastFilters) {
      handleSearch(lastFilters, page);
    }
  };

  const handleReset = () => {
    setCards([]);
    setCurrentPage(1);
    setTotalCount(0);
    setHasMore(false);
    setLastFilters(null);
  };

  const handleAddCard = (card: YugiohCard) => {
    setSelectedCards((prev) => [...prev, card]);
    toast.success(`Đã thêm ${card.name}`);
  };

  const handleGoToDeckBuilder = () => {
    if (selectedCards.length === 0) {
      toast.error("Chưa chọn bài nào");
      return;
    }

    // Group cards and create deck format
    const cardCounts = new Map<number, { card: YugiohCard; count: number }>();
    selectedCards.forEach((card) => {
      const existing = cardCounts.get(card.id);
      if (existing) {
        existing.count++;
      } else {
        cardCounts.set(card.id, { card, count: 1 });
      }
    });

    // Build arrays of card IDs for each section
    const mainIds: number[] = [];
    const extraIds: number[] = [];
    const sideIds: number[] = [];

    cardCounts.forEach(({ card, count }) => {
      // Determine section based on card type
      const type = card.type.toLowerCase();
      const isExtra =
        type.includes("fusion") ||
        type.includes("synchro") ||
        type.includes("xyz") ||
        type.includes("link");

      const quantity = Math.min(count, 3);
      const targetArray = isExtra ? extraIds : mainIds;

      // Add card ID multiple times based on quantity
      for (let i = 0; i < quantity; i++) {
        targetArray.push(card.id);
      }
    });

    // Get unique cards for the cards array
    const uniqueCards = Array.from(cardCounts.values()).map(({ card }) => card);

    sessionStorage.setItem(
      "importedDeck",
      JSON.stringify({
        parsed: { main: mainIds, extra: extraIds, side: sideIds },
        cards: uniqueCards,
      })
    );

    navigate("/deck-builder");
  };

  return (
    <>
      <SEO
        title="Yu-Gi-Oh! Card Search - Find & Browse 12,000+ Cards Online"
        description="Search and browse through 12,000+ Yu-Gi-Oh! cards with advanced filters. Find monsters, spells, traps, and more. Check ban lists and build decks with our comprehensive card database."
        keywords="Yu-Gi-Oh card search, YGOPRODeck, card database, monster cards, spell cards, trap cards, TCG cards, OCG cards, deck building"
      />
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container py-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Tìm kiếm bài</h1>
              <div className="flex items-center gap-3">
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TCG">TCG</SelectItem>
                    <SelectItem value="OCG">OCG</SelectItem>
                  </SelectContent>
                </Select>
                {selectedCards.length > 0 && (
                  <>
                    <Badge variant="secondary" className="gap-1">
                      <ShoppingCart className="h-3 w-3" />
                      {selectedCards.length} bài đã chọn
                    </Badge>
                    <Button size="sm" onClick={handleGoToDeckBuilder}>
                      Đến Deck Builder
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            <CardSearchFilters
              onSearch={(filters) => handleSearch(filters, 1)}
              loading={loading}
            />

            <CardGrid
              cards={cards}
              loading={loading}
              onCardClick={setSelectedCard}
              onAddCard={handleAddCard}
              emptyMessage="Nhập tên bài hoặc sử dụng bộ lọc để tìm kiếm"
            />

            {/* Pagination */}
            {totalCount > 50 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Hiển thị {cards.length} / {totalCount} kết quả
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          currentPage > 1 && handlePageChange(currentPage - 1)
                        }
                        className={
                          currentPage <= 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

                    {/* Page numbers - show max 5 pages around current page */}
                    {Array.from(
                      { length: Math.min(5, Math.ceil(totalCount / 50)) },
                      (_, i) => {
                        const pageNum = Math.max(1, currentPage - 2) + i;
                        if (pageNum > Math.ceil(totalCount / 50)) return null;

                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => handlePageChange(pageNum)}
                              isActive={pageNum === currentPage}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                    )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          hasMore && handlePageChange(currentPage + 1)
                        }
                        className={
                          !hasMore
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </main>

        <CardDetailModal
          card={selectedCard}
          open={!!selectedCard}
          onOpenChange={(open) => !open && setSelectedCard(null)}
          onAddCard={handleAddCard}
        />
      </div>
    </>
  );
}

import { useState, useRef, useCallback, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { CardSearchFilters } from "@/components/cards/CardSearchFilters";
import { CardGrid } from "@/components/cards/CardGrid";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import { searchCards, getCacheStats, syncCardsToCache } from "@/lib/ygoprodeck-api";
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
import { useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, ArrowRight, Database, Cloud, Layers, X } from "lucide-react";
import { useBanList } from "@/hooks/useBanList";
import { useLanguage } from "@/i18n/LanguageContext";
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
  const [dataSource, setDataSource] = useState<'cache' | 'api'>('api');
  const [cacheStats, setCacheStats] = useState<{ cardCount: number; needsRefresh: boolean }>({ cardCount: 0, needsRefresh: true });
  const [isSyncing, setIsSyncing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  // Archetype handed off from a card modal (Deck Builder test-hand, etc.)
  const pendingArchetype = useRef<string | null>(
    (location.state as { archetype?: string } | null)?.archetype ?? null
  );
  const { format, setFormat } = useBanList();

  // Check cache status on mount
  useEffect(() => {
    checkCacheStatus();
  }, []);

  const checkCacheStatus = async () => {
    const stats = await getCacheStats();
    setCacheStats({
      cardCount: stats.cardCount,
      needsRefresh: stats.needsRefresh,
    });
  };

  const handleSyncCache = async () => {
    setIsSyncing(true);
    toast.info(t("search.syncing"));

    try {
      const result = await syncCardsToCache();
      if (result.success) {
        toast.success(t("search.synced", { count: result.count }));
        await checkCacheStatus();
      } else {
        toast.error(t("search.syncFailed", { error: result.error ?? "" }));
      }
    } catch (error) {
      toast.error(t("search.syncError"));
    } finally {
      setIsSyncing(false);
    }
  };

  // Cancel any pending requests
  const cancelPendingRequests = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const handleSearch = useCallback(async (filters: Filters, page: number = 1) => {
    // Cancel previous requests before starting new one
    cancelPendingRequests();
    
    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    setLoading(true);
    
    try {
      // Archetype browsing shows ONLY cards with that exact archetype —
      // custom cards are excluded (an undefined keyword would otherwise
      // return *all* custom cards and pollute the related list).
      const archetypeOnly = filters.archetype && !filters.name;
      // Search both YGOPRODeck API and custom cards in parallel
      const [apiResults, customResults] = await Promise.all([
        searchCards(filters, page, 50, abortController.signal),
        archetypeOnly
          ? Promise.resolve([] as YugiohCard[])
          : searchCustomCards(filters.name),
      ]);

      // Check if request was aborted before updating state
      if (abortController.signal.aborted) {
        return;
      }

      // Merge results - custom cards first
      const allResults = [...customResults, ...apiResults.cards];
      setCards(allResults);
      setTotalCount(apiResults.totalCount + customResults.length);
      setHasMore(apiResults.hasMore);
      setDataSource(apiResults.source);
      setLastFilters(filters);
      setCurrentPage(page);

      if (allResults.length === 0) {
        toast.info(t("search.noResults"));
      } else if (customResults.length > 0) {
        toast.success(
          t("search.foundMixed", {
            custom: customResults.length,
            api: apiResults.cards.length,
          })
        );
      }
    } catch (error) {
      // Don't show error for aborted requests
      if ((error as Error).message !== 'Request aborted') {
        toast.error(t("search.searchError"));
      }
    } finally {
      // Only clear loading if this is still the current request
      if (abortControllerRef.current === abortController) {
        setLoading(false);
      }
    }
  }, [cancelPendingRequests, t]);

  const handlePageChange = useCallback((page: number) => {
    if (lastFilters) {
      handleSearch(lastFilters, page);
    }
  }, [lastFilters, handleSearch]);

  const handleArchetypeSelect = useCallback((archetype: string) => {
    setSelectedCard(null);
    handleSearch({ archetype }, 1);
  }, [handleSearch]);

  // Consume a one-shot archetype handoff (e.g. Related Cards from a modal
  // opened outside the Search page) exactly once on mount.
  useEffect(() => {
    if (pendingArchetype.current) {
      const archetype = pendingArchetype.current;
      pendingArchetype.current = null;
      window.history.replaceState({}, "");
      handleSearch({ archetype }, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReset = useCallback(() => {
    cancelPendingRequests();
    setCards([]);
    setCurrentPage(1);
    setTotalCount(0);
    setHasMore(false);
    setLastFilters(null);
    setDataSource('api');
  }, [cancelPendingRequests]);

  const handleAddCard = useCallback((card: YugiohCard) => {
    setSelectedCards((prev) => [...prev, card]);
    toast.success(t("search.addedCard", { name: card.name }));
  }, [t]);

  const handleGoToDeckBuilder = useCallback(() => {
    if (selectedCards.length === 0) {
      toast.error(t("search.noneSelected"));
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
  }, [selectedCards, navigate, t]);

  return (
    <>
      <SEO
        title="Yu-Gi-Oh! Card Search - Find & Browse 12,000+ Cards Online"
        description="Search and browse through 12,000+ Yu-Gi-Oh! cards with advanced filters. Find monsters, spells, traps, and more. Check ban lists and build decks with our comprehensive card database."
        keywords="Yu-Gi-Oh card search, YGOPRODeck, card database, monster cards, spell cards, trap cards, TCG cards, OCG cards, deck building"
      />
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container py-6 px-4">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{t("search.title")}</h1>
                
                {/* Data Source Badge */}
                {cards.length > 0 && (
                  <Badge 
                    variant={dataSource === 'cache' ? 'default' : 'secondary'}
                    className="gap-1"
                  >
                    {dataSource === 'cache' ? (
                      <>
                        <Database className="h-3 w-3" />
                        Cache
                      </>
                    ) : (
                      <>
                        <Cloud className="h-3 w-3" />
                        API
                      </>
                    )}
                  </Badge>
                )}

                {/* Cache Status */}
                {cacheStats.cardCount > 0 ? (
                  <span className="text-xs text-muted-foreground">
                    {t("search.cacheCount", {
                      count: cacheStats.cardCount.toLocaleString(),
                    })}
                  </span>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSyncCache}
                    disabled={isSyncing}
                  >
                    {isSyncing ? t("search.syncingBtn") : t("search.cacheBtn")}
                  </Button>
                )}
              </div>

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
                      {t("search.selected", { count: selectedCards.length })}
                    </Badge>
                    <Button size="sm" onClick={handleGoToDeckBuilder}>
                      {t("search.goBuilder")}
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

            {/* Archetype browser disabled for now — re-enable by rendering
                <ArchetypeBrowser onSelect={handleArchetypeSelect} /> here.
                Related-cards search via the modal still works. */}

            {lastFilters?.archetype && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1.5">
                  <Layers className="h-3 w-3" />
                  {t("search.archetypeBadge", { name: lastFilters.archetype })}
                  <button onClick={handleReset} aria-label={t("search.clearArchetype")}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </div>
            )}

            <CardGrid
              cards={cards}
              loading={loading}
              onCardClick={setSelectedCard}
              onAddCard={handleAddCard}
              emptyMessage={t("search.gridEmpty")}
            />

            {/* Pagination */}
            {totalCount > 50 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {t("search.showing", {
                    shown: cards.length,
                    total: totalCount,
                  })}
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
          onViewArchetype={handleArchetypeSelect}
        />
      </div>
    </>
  );
}

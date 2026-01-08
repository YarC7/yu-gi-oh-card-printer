import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  FilterMenu,
  CardFilterState,
  DEFAULT_FILTER_STATE,
} from "@/components/cards/FilterMenu";
import { VirtualizedCardGrid } from "@/components/cards/VirtualizedCardGrid";
import { searchCards } from "@/lib/ygoprodeck-api";
import { searchCustomCards } from "@/lib/custom-cards-service";
import { YugiohCard, CardSearchFilters as Filters } from "@/types/card";
import { Search, Filter, RotateCcw, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CardSearchPanelProps {
  onCardClick?: (card: YugiohCard) => void;
  onAddCard?: (card: YugiohCard) => void;
  className?: string;
}

// Convert CardFilterState to API Filters
function convertFiltersToAPI(state: CardFilterState, name?: string): Filters {
  const filters: Filters = {};

  if (name && name.trim()) {
    filters.name = name.trim();
  }

  if (state.cardTypes.length > 0) {
    const types = state.cardTypes;
    if (types.includes("Spell")) {
      filters.type = "Spell Card";
    } else if (types.includes("Trap")) {
      filters.type = "Trap Card";
    } else if (types.includes("Link")) {
      filters.type = "Link Monster";
    } else if (types.includes("Xyz")) {
      filters.type = types.includes("Pendulum")
        ? "XYZ Pendulum Effect Monster"
        : "XYZ Monster";
    } else if (types.includes("Synchro")) {
      filters.type = types.includes("Pendulum")
        ? "Synchro Pendulum Effect Monster"
        : "Synchro Monster";
    } else if (types.includes("Fusion")) {
      filters.type = "Fusion Monster";
    } else if (types.includes("Ritual")) {
      filters.type = types.includes("Effect")
        ? "Ritual Effect Monster"
        : "Ritual Monster";
    } else if (types.includes("Pendulum")) {
      filters.type = types.includes("Normal")
        ? "Pendulum Normal Monster"
        : "Pendulum Effect Monster";
    } else if (types.includes("Normal")) {
      filters.type = "Normal Monster";
    } else if (types.includes("Effect")) {
      filters.type = "Effect Monster";
    }
  }

  if (state.spellTrapTypes.length === 1) {
    const spellTrapType = state.spellTrapTypes[0];
    const race = spellTrapType.replace(" Spell", "").replace(" Trap", "");
    filters.race = race;
    if (!filters.type) {
      if (spellTrapType.includes("Spell")) {
        filters.type = "Spell Card";
      } else if (spellTrapType.includes("Trap")) {
        filters.type = "Trap Card";
      }
    }
  }

  if (state.attributes.length === 1) {
    filters.attribute = state.attributes[0];
  }

  if (state.monsterTypes.length === 1) {
    filters.race = state.monsterTypes[0];
  }

  if (state.levelMin !== undefined) {
    filters.level = state.levelMin;
  }

  if (state.atkMin !== undefined) {
    filters.atkMin = state.atkMin;
  }

  if (state.defMin !== undefined) {
    filters.defMin = state.defMin;
  }

  return filters;
}

export function CardSearchPanel({
  onCardClick,
  onAddCard,
  className,
}: CardSearchPanelProps) {
  const [cards, setCards] = useState<YugiohCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [filterState, setFilterState] =
    useState<CardFilterState>(DEFAULT_FILTER_STATE);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const activeFilterCount =
    filterState.cardTypes.length +
    filterState.attributes.length +
    filterState.monsterTypes.length +
    filterState.specialTypes.length +
    (filterState.levelMin !== undefined ? 1 : 0) +
    (filterState.atkMin !== undefined ? 1 : 0) +
    (filterState.defMin !== undefined ? 1 : 0);

  const handleSearch = async (filters: Filters) => {
    setLoading(true);
    try {
      const [apiResults, customResults] = await Promise.all([
        searchCards(filters),
        searchCustomCards(filters.name),
      ]);
      setCards([...customResults, ...apiResults]);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const hasNameFilter = name && name.length >= 2;
    const hasOtherFilters = activeFilterCount > 0;

    if (hasNameFilter || hasOtherFilters) {
      debounceRef.current = setTimeout(() => {
        const apiFilters = convertFiltersToAPI(filterState, name);
        handleSearch(apiFilters);
      }, 300);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [name, filterState, activeFilterCount]);

  const handleReset = () => {
    setName("");
    setFilterState(DEFAULT_FILTER_STATE);
    setCards([]);
  };

  const handleDragStart = (e: React.DragEvent, card: YugiohCard) => {
    e.dataTransfer.setData("application/json", JSON.stringify(card));
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Search Header */}
      <div className="space-y-2 pb-3 border-b">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm bài..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-8 pr-8 h-9"
            />
            {loading && (
              <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-9 px-2.5"
              >
                <Filter className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="h-4 px-1 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-lg">
              <SheetHeader>
                <SheetTitle>Bộ lọc</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterMenu
                  filters={filterState}
                  onChange={setFilterState}
                  onConfirm={() => setIsFilterOpen(false)}
                  onCancel={() => setIsFilterOpen(false)}
                  onReset={() => setFilterState(DEFAULT_FILTER_STATE)}
                />
              </div>
            </SheetContent>
          </Sheet>

          <Button
            variant="outline"
            size="sm"
            className="h-9 px-2.5"
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Active filter badges */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-1">
            {filterState.cardTypes.map((type) => (
              <Badge key={type} variant="secondary" className="text-xs gap-1">
                {type}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() =>
                    setFilterState((prev) => ({
                      ...prev,
                      cardTypes: prev.cardTypes.filter((t) => t !== type),
                    }))
                  }
                />
              </Badge>
            ))}
            {filterState.attributes.map((attr) => (
              <Badge key={attr} variant="secondary" className="text-xs gap-1">
                {attr}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() =>
                    setFilterState((prev) => ({
                      ...prev,
                      attributes: prev.attributes.filter((a) => a !== attr),
                    }))
                  }
                />
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Card Results */}
      <div className="flex-1 mt-3">
        {cards.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {loading ? "Đang tìm kiếm..." : "Nhập tên bài để tìm kiếm"}
          </div>
        ) : (
          <VirtualizedCardGrid
            cards={cards}
            onCardClick={onCardClick}
            onAddCard={onAddCard}
            className="pr-3"
          />
        )}
      </div>

      <div className="pt-2 border-t text-xs text-muted-foreground text-center">
        Kéo thả hoặc double-click để thêm bài
      </div>
    </div>
  );
}

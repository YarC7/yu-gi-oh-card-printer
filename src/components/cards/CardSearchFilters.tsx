import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FilterMenu,
  CardFilterState,
  DEFAULT_FILTER_STATE,
} from "./FilterMenu";
import { CardSearchFilters as Filters } from "@/types/card";
import {
  Search,
  RotateCcw,
  Loader2,
  Filter,
  X,
  Clock,
  TrendingUp,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { getSearchSuggestions, addToSearchHistory } from "@/lib/ygoprodeck-api";

const SEARCH_HISTORY_KEY = "ygo-search-history";

function getSearchHistory(): string[] {
  try {
    const value = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!value) return [];
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

interface CardSearchFiltersProps {
  onSearch: (filters: Filters) => void;
  loading?: boolean;
}

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

export function CardSearchFilters({
  onSearch,
  loading,
}: CardSearchFiltersProps) {
  const [name, setName] = useState("");
  const [filterState, setFilterState] =
    useState<CardFilterState>(DEFAULT_FILTER_STATE);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionsRef = useRef<NodeJS.Timeout | null>(null);
  const onSearchRef = useRef(onSearch);
  const lastSearchRef = useRef<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  onSearchRef.current = onSearch;

  // Load search history on mount
  useEffect(() => {
    setSearchHistory(getSearchHistory());
  }, []);

  const activeFilterCount =
    filterState.cardTypes.length +
    filterState.attributes.length +
    filterState.monsterTypes.length +
    filterState.specialTypes.length +
    (filterState.levelMin !== undefined ? 1 : 0) +
    (filterState.atkMin !== undefined ? 1 : 0) +
    (filterState.defMin !== undefined ? 1 : 0);

  // Fetch suggestions when name changes
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const results = await getSearchSuggestions(query, 5);
    setSuggestions(results);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const hasNameFilter = name && name.length >= 2;
    const hasOtherFilters = activeFilterCount > 0;

    if (hasNameFilter || hasOtherFilters) {
      const searchKey = JSON.stringify({ name, filterState });
      if (searchKey === lastSearchRef.current) {
        return;
      }

      debounceRef.current = setTimeout(() => {
        const apiFilters = convertFiltersToAPI(filterState, name);
        lastSearchRef.current = searchKey;
        onSearchRef.current(apiFilters);

        // Add to history and refresh
        if (name) {
          addToSearchHistory(name);
          setSearchHistory(getSearchHistory());
        }
      }, 250);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [name, filterState, activeFilterCount]);

  // Debounced suggestions
  useEffect(() => {
    if (suggestionsRef.current) {
      clearTimeout(suggestionsRef.current);
    }

    if (name.length >= 2 && showSuggestions) {
      suggestionsRef.current = setTimeout(() => {
        fetchSuggestions(name);
      }, 150);
    } else {
      setSuggestions([]);
    }

    return () => {
      if (suggestionsRef.current) {
        clearTimeout(suggestionsRef.current);
      }
    };
  }, [name, fetchSuggestions, showSuggestions]);

  const handleReset = useCallback(() => {
    setName("");
    setFilterState(DEFAULT_FILTER_STATE);
    setSuggestions([]);
    lastSearchRef.current = "";
  }, []);

  const handleConfirmFilters = useCallback(() => {
    setIsFilterOpen(false);
    const apiFilters = convertFiltersToAPI(filterState, name);
    lastSearchRef.current = JSON.stringify({ name, filterState });
    onSearchRef.current(apiFilters);
  }, [filterState, name]);

  const handleSuggestionClick = (suggestion: string) => {
    setName(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
    const apiFilters = convertFiltersToAPI(filterState, suggestion);
    onSearchRef.current(apiFilters);
    addToSearchHistory(suggestion);
    setSearchHistory(getSearchHistory());
    inputRef.current?.blur();
  };

  const handleHistoryClick = (term: string) => {
    setName(term);
    setShowSuggestions(false);
    const apiFilters = convertFiltersToAPI(filterState, term);
    onSearchRef.current(apiFilters);
  };

  const getQuickBadges = useCallback(() => {
    const badges: { label: string; onRemove: () => void }[] = [];

    filterState.cardTypes.forEach((type) => {
      badges.push({
        label: type,
        onRemove: () =>
          setFilterState((prev) => ({
            ...prev,
            cardTypes: prev.cardTypes.filter((t) => t !== type),
          })),
      });
    });

    filterState.attributes.forEach((attr) => {
      badges.push({
        label: attr,
        onRemove: () =>
          setFilterState((prev) => ({
            ...prev,
            attributes: prev.attributes.filter((a) => a !== attr),
          })),
      });
    });

    filterState.monsterTypes.slice(0, 2).forEach((type) => {
      badges.push({
        label: type,
        onRemove: () =>
          setFilterState((prev) => ({
            ...prev,
            monsterTypes: prev.monsterTypes.filter((t) => t !== type),
          })),
      });
    });

    if (filterState.monsterTypes.length > 2) {
      badges.push({
        label: `+${filterState.monsterTypes.length - 2} more`,
        onRemove: () =>
          setFilterState((prev) => ({ ...prev, monsterTypes: [] })),
      });
    }

    return badges;
  }, [filterState]);

  const quickBadges = getQuickBadges();

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Tìm theo tên hoặc mô tả bài..."
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              // Delay to allow clicking suggestions
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            className="pl-10 pr-10"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}

          {/* Search Suggestions Dropdown */}
          {showSuggestions &&
            (suggestions.length > 0 ||
              (name.length === 0 && searchHistory.length > 0)) && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 py-2">
                {/* Show history when input is empty */}
                {name.length === 0 && searchHistory.length > 0 && (
                  <>
                    <div className="px-3 py-1 text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Lịch sử tìm kiếm
                    </div>
                    {searchHistory.slice(0, 5).map((term, i) => (
                      <button
                        key={`history-${i}`}
                        className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent flex items-center gap-2"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleHistoryClick(term);
                        }}
                      >
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {term}
                      </button>
                    ))}
                  </>
                )}

                {/* Show suggestions when typing */}
                {name.length >= 2 && suggestions.length > 0 && (
                  <>
                    <div className="px-3 py-1 text-xs text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Gợi ý
                    </div>
                    {suggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent flex items-center gap-2"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSuggestionClick(suggestion);
                        }}
                      >
                        <Search className="h-3 w-3 text-muted-foreground" />
                        <span
                          dangerouslySetInnerHTML={{
                            __html: suggestion.replace(
                              new RegExp(`(${name})`, "gi"),
                              '<mark class="bg-yellow-200 font-medium">$1</mark>',
                            ),
                          }}
                        />
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
        </div>

        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Bộ lọc
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>Filter Menu</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterMenu
                filters={filterState}
                onChange={setFilterState}
                onConfirm={handleConfirmFilters}
                onCancel={() => setIsFilterOpen(false)}
                onReset={() => setFilterState(DEFAULT_FILTER_STATE)}
              />
            </div>
          </SheetContent>
        </Sheet>

        <Button variant="outline" onClick={handleReset} disabled={loading}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick filter badges */}
      {quickBadges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {quickBadges.map((badge, i) => (
            <Badge
              key={i}
              variant="secondary"
              className="gap-1 cursor-pointer hover:bg-destructive/20"
              onClick={badge.onRemove}
            >
              {badge.label}
              <X className="h-3 w-3" />
            </Badge>
          ))}
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={handleReset}
            >
              Xoá tất cả
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

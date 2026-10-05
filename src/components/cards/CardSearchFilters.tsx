import { useState, useEffect, useMemo, useRef, useCallback, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
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
  ArrowUpRight,
  CornerDownLeft,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/i18n/LanguageContext";
import { getSearchSuggestions, addToSearchHistory } from "@/lib/ygoprodeck-api";

// History was written under two different keys over time:
// the component's own "ygo-search-history" and the cache service's
// "ygo_search_history" (via addToSearchHistory). Read both, merge,
// dedupe — otherwise half the history never shows up.
const HISTORY_KEYS = ["ygo-search-history", "ygo_search_history"];

function getSearchHistory(): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const key of HISTORY_KEYS) {
    try {
      const value = localStorage.getItem(key);
      if (!value) continue;
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) continue;
      for (const item of parsed) {
        if (typeof item !== "string") continue;
        const lower = item.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          merged.push(item);
        }
      }
    } catch {
      // Ignore corrupt entries
    }
  }
  return merged.slice(0, 10);
}

// Theme-aware match highlight (replaces the old hardcoded yellow <mark>).
function Highlighted({ text, query }: { text: string; query: string }) {
  const q = query.trim().toLowerCase();
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-semibold text-primary">
        {text.slice(idx, idx + q.length)}
      </span>
      {text.slice(idx + q.length)}
    </>
  );
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
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [filterState, setFilterState] =
    useState<CardFilterState>(DEFAULT_FILTER_STATE);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionsRef = useRef<NodeJS.Timeout | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
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

  // Flat keyboard-navigable list: history first, then suggestions.
  const showHistory = name.length === 0 && searchHistory.length > 0;
  const navItems = useMemo(
    () => [
      ...(showHistory
        ? searchHistory
            .slice(0, 5)
            .map((value) => ({ type: "history" as const, value }))
        : []),
      ...(name.length >= 2
        ? suggestions.map((value) => ({ type: "suggestion" as const, value }))
        : []),
    ],
    [showHistory, searchHistory, suggestions, name.length]
  );

  // Fire a search immediately instead of waiting for the debounce.
  const commitSearch = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const apiFilters = convertFiltersToAPI(filterState, name);
    lastSearchRef.current = JSON.stringify({ name, filterState });
    onSearchRef.current(apiFilters);
    if (name) {
      addToSearchHistory(name);
      setSearchHistory(getSearchHistory());
    }
    setShowSuggestions(false);
    setActiveIndex(-1);
  }, [filterState, name]);

  // Reset keyboard cursor whenever the list changes…
  useEffect(() => {
    setActiveIndex(-1);
  }, [name, suggestions, showHistory]);

  // …and keep the cursor visible while arrowing through it.
  useEffect(() => {
    if (activeIndex < 0) return;
    listRef.current
      ?.querySelector(`[data-nav-idx="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

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
    setActiveIndex(-1);
    const apiFilters = convertFiltersToAPI(filterState, suggestion);
    lastSearchRef.current = JSON.stringify({
      name: suggestion,
      filterState,
    });
    onSearchRef.current(apiFilters);
    addToSearchHistory(suggestion);
    setSearchHistory(getSearchHistory());
    inputRef.current?.blur();
  };

  const handleHistoryClick = (term: string) => {
    setName(term);
    setShowSuggestions(false);
    setActiveIndex(-1);
    const apiFilters = convertFiltersToAPI(filterState, term);
    lastSearchRef.current = JSON.stringify({ name: term, filterState });
    onSearchRef.current(apiFilters);
  };

  const handleClearHistory = () => {
    try {
      for (const key of HISTORY_KEYS) localStorage.removeItem(key);
    } catch {
      // Ignore storage errors
    }
    setSearchHistory([]);
    setActiveIndex(-1);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setShowSuggestions(true);
      setActiveIndex((i) => Math.min(i + 1, navItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      const item = navItems[activeIndex];
      if (item) {
        e.preventDefault();
        if (item.type === "history") handleHistoryClick(item.value);
        else handleSuggestionClick(item.value);
      } else if (name.trim().length >= 2) {
        e.preventDefault();
        commitSearch();
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
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
            placeholder={t("filters.searchPh")}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleInputKeyDown}
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
            (navItems.length > 0 || name.trim().length >= 2) && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-popover/95 shadow-xl shadow-black/5 backdrop-blur-md">
                <div
                  ref={listRef}
                  className="scrollbar-thin max-h-[320px] overflow-y-auto p-1.5"
                >
                  {/* History */}
                  {showHistory && (
                    <div className="flex items-center justify-between px-2.5 pb-1 pt-2">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                        {t("filters.historyTitle")}
                      </p>
                      <button
                        className="flex items-center gap-1 rounded px-1 py-0.5 text-[11px] text-muted-foreground transition-colors hover:text-destructive"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleClearHistory();
                        }}
                      >
                        <X className="h-3 w-3" strokeWidth={2} />
                        {t("filters.clearHistory")}
                      </button>
                    </div>
                  )}
                  {showHistory &&
                    navItems
                      .map((item, i) => ({ item, i }))
                      .filter(({ item }) => item.type === "history")
                      .map(({ item, i }) => (
                        <div key={`history-${i}`} className="modal-rise" style={{ "--d": `${i * 30}ms` } as CSSProperties}>
                          <button
                            data-nav-idx={i}
                            className={cn(
                              "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent",
                              activeIndex === i && "bg-accent"
                            )}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleHistoryClick(item.value);
                            }}
                            onMouseEnter={() => setActiveIndex(i)}
                          >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" strokeWidth={2} />
                            </span>
                            <span className="min-w-0 flex-1 truncate">
                              {item.value}
                            </span>
                            <ArrowUpRight
                              className={cn(
                                "h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity",
                                activeIndex === i && "opacity-100"
                              )}
                              strokeWidth={2}
                            />
                          </button>
                        </div>
                      ))}

                  {/* Suggestions */}
                  {name.length >= 2 && suggestions.length > 0 && (
                    <p className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {t("filters.suggestTitle")}
                    </p>
                  )}
                  {name.length >= 2 &&
                    navItems
                      .map((item, i) => ({ item, i }))
                      .filter(({ item }) => item.type === "suggestion")
                      .map(({ item, i }) => (
                        <div key={i} className="modal-rise" style={{ "--d": `${i * 30}ms` } as CSSProperties}>
                          <button
                            data-nav-idx={i}
                            className={cn(
                              "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent",
                              activeIndex === i && "bg-accent"
                            )}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSuggestionClick(item.value);
                            }}
                            onMouseEnter={() => setActiveIndex(i)}
                          >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                              <Search className="h-3.5 w-3.5" strokeWidth={2} />
                            </span>
                            <span className="min-w-0 flex-1 truncate">
                              <Highlighted text={item.value} query={name} />
                            </span>
                            <ArrowUpRight
                              className={cn(
                                "h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity",
                                activeIndex === i && "opacity-100"
                              )}
                              strokeWidth={2}
                            />
                          </button>
                        </div>
                      ))}

                  {/* Direct search for the typed query */}
                  {name.trim().length >= 2 && (
                    <button
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        commitSearch();
                      }}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                        <CornerDownLeft className="h-3.5 w-3.5" strokeWidth={2} />
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {t("filters.searchFor", { query: name.trim() })}
                      </span>
                    </button>
                  )}
                </div>

                {/* Keyboard hints */}
                <div className="hidden items-center gap-3 border-t border-border px-3 py-2 text-[11px] text-muted-foreground sm:flex">
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-border bg-muted px-1 font-mono">
                      ↑
                    </kbd>
                    <kbd className="rounded border border-border bg-muted px-1 font-mono">
                      ↓
                    </kbd>
                    {t("filters.hintMove")}
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-border bg-muted px-1 font-mono">
                      Enter
                    </kbd>
                    {t("filters.hintSelect")}
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-border bg-muted px-1 font-mono">
                      Esc
                    </kbd>
                    {t("filters.hintClose")}
                  </span>
                </div>
              </div>
            )}
        </div>

        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              {t("filters.filterBtn")}
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>{t("filters.title")}</SheetTitle>
            </SheetHeader>
            <div className="mb-2 mt-6 flex min-h-0 flex-1 flex-col">
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
              {t("filters.clearAll")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

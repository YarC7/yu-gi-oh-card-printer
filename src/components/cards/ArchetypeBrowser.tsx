import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Layers, Search, Loader2 } from "lucide-react";
import { getAllArchetypes } from "@/lib/ygoprodeck-api";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

interface ArchetypeBrowserProps {
  onSelect: (archetype: string) => void;
}

const SUGGESTION_LIMIT = 8;

export function ArchetypeBrowser({ onSelect }: ArchetypeBrowserProps) {
  const { t } = useLanguage();
  const [archetypes, setArchetypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAllArchetypes()
      .then((list) => {
        if (!cancelled) {
          setArchetypes(list);
          setLoadFailed(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (blurTimer.current) clearTimeout(blurTimer.current);
    };
  }, []);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const starts: string[] = [];
    const contains: string[] = [];
    for (const name of archetypes) {
      if (starts.length + contains.length >= SUGGESTION_LIMIT * 3) break;
      const lower = name.toLowerCase();
      if (lower.startsWith(q)) starts.push(name);
      else if (lower.includes(q)) contains.push(name);
    }
    return [...starts, ...contains].slice(0, SUGGESTION_LIMIT);
  }, [query, archetypes]);

  const submit = (raw: string) => {
    const value = raw.trim();
    if (value.length < 2) return;
    // Prefer the canonical exact name so the API archetype filter hits.
    const exact = archetypes.find((a) => a.toLowerCase() === value.toLowerCase());
    setQuery("");
    setFocused(false);
    onSelect(exact ?? value);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
          <h2 className="text-sm font-semibold">{t("archetype.title")}</h2>
        </div>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {loading ? "…" : t("archetype.count", { count: archetypes.length })}
        </span>
      </div>

      {loading ? (
        <div className="shimmer-bg h-10 animate-pulse rounded-md" />
      ) : loadFailed ? (
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-destructive">{t("archetype.loadError")}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true);
              setLoadFailed(false);
              getAllArchetypes()
                .then((list) => setArchetypes(list))
                .catch(() => setLoadFailed(true))
                .finally(() => setLoading(false));
            }}
          >
            {t("common.retry")}
          </Button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("archetype.placeholder")}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setFocused(true);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              blurTimer.current = setTimeout(() => setFocused(false), 200);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit(query);
              if (e.key === "Escape") setFocused(false);
            }}
            className="pl-10"
          />
          {focused && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-md border border-border bg-popover py-1 shadow-lg">
              {suggestions.map((name) => (
                <button
                  key={name}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-accent"
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    submit(name);
                  }}
                >
                  <Layers className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={2} />
                  <span className="truncate">{name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

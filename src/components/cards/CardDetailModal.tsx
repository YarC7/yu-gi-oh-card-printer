import { CSSProperties, useEffect, useState } from "react";
import { YugiohCard } from "@/types/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Star,
  ExternalLink,
  Layers,
  User,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpLeft,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowDownRight,
} from "lucide-react";
import { BanStatusBadge } from "./BanStatusBadge";
import { AttributeOrb } from "./AttributeOrb";
import { useBanList } from "@/hooks/useBanList";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { getCustomCardAuthorName } from "@/lib/custom-cards-service";
import { LazyImage } from "@/components/ui/lazy-image";
import { cn } from "@/lib/utils";

interface CardDetailModalProps {
  card: YugiohCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCard?: (card: YugiohCard) => void;
  onViewArchetype?: (archetype: string) => void;
}

// 3x3 link-arrow layout; center cell shows the Link rating instead.
const LINK_ARROWS = [
  { marker: "Top-Left", Icon: ArrowUpLeft },
  { marker: "Top", Icon: ArrowUp },
  { marker: "Top-Right", Icon: ArrowUpRight },
  { marker: "Left", Icon: ArrowLeft },
  { marker: null, Icon: null },
  { marker: "Right", Icon: ArrowRight },
  { marker: "Bottom-Left", Icon: ArrowDownLeft },
  { marker: "Bottom", Icon: ArrowDown },
  { marker: "Bottom-Right", Icon: ArrowDownRight },
] as const;

function Rise({
  index,
  className,
  children,
}: {
  index: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn("modal-rise", className)}
      style={{ "--d": `${index * 70}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </h4>
  );
}

function StatCell({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 px-4 py-2.5 first:pl-0">
      <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-base font-semibold tabular-nums">
        {value}
      </span>
    </div>
  );
}

export function CardDetailModal({
  card,
  open,
  onOpenChange,
  onAddCard,
  onViewArchetype,
}: CardDetailModalProps) {
  const { getBanStatus, format, loading: banListLoading } = useBanList();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [authorName, setAuthorName] = useState<string | null>(null);
  const [authorLoading, setAuthorLoading] = useState(false);

  // Custom cards carry their author's auth user id — resolve the
  // profiles.display_name once per card (service caches by user id).
  useEffect(() => {
    if (!card?.isCustom || !card.customUserId) {
      setAuthorName(null);
      setAuthorLoading(false);
      return;
    }
    let cancelled = false;
    setAuthorLoading(true);
    setAuthorName(null);
    getCustomCardAuthorName(card.customUserId).then((name) => {
      if (!cancelled) {
        setAuthorName(name);
        setAuthorLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [card?.isCustom, card?.customUserId]);

  if (!card) return null;

  const type = card.type.toLowerCase();
  const isMonster = type.includes("monster");
  const isLink = type.includes("link");
  const isXyz = type.includes("xyz");
  const isPendulum = type.includes("pendulum");
  // Full-resolution art: YGOPRODeck's image_url_small (~168px) looks
  // blurry at modal sizes, so prefer image_url and only fall back.
  const imageUrl = card.card_images[0]?.image_url ?? card.card_images[0]?.image_url_small;

  const tcgStatus = banListLoading ? null : getBanStatus(card.id, "TCG");
  const ocgStatus = banListLoading ? null : getBanStatus(card.id, "OCG");
  const hasBanInfo = tcgStatus !== null || ocgStatus !== null;

  const sets = card.card_sets ?? [];
  const visibleSets = sets.slice(0, 3);
  const price = card.card_prices?.[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] gap-0 overflow-hidden p-0 sm:max-w-5xl lg:max-w-6xl">
        {/* key replays the stagger when switching cards while open */}
        <div
          key={card.id}
          className="grid max-h-[90vh] grid-cols-1 overflow-y-auto md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:overflow-hidden"
        >
          {/* Art rail */}
          <div className="relative flex flex-col bg-muted/60 p-5 md:max-h-[90vh] md:overflow-y-auto md:p-6">
            <Rise index={0} className="relative mx-auto w-full max-w-[220px] md:max-w-none">
              {imageUrl ? (
                <LazyImage
                  src={imageUrl}
                  alt={card.name}
                  className="w-full rounded-xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.25)]"
                />
              ) : (
                <div className="flex aspect-[3/4] w-full items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
                  {t("modal.noImage")}
                </div>
              )}
              {(tcgStatus || ocgStatus) && (
                <div className="absolute -left-2 -top-2 flex gap-1.5">
                  {tcgStatus && <BanStatusBadge banStatus={tcgStatus} />}
                  {ocgStatus && ocgStatus !== tcgStatus && (
                    <BanStatusBadge banStatus={ocgStatus} />
                  )}
                </div>
              )}
            </Rise>
            <Rise index={1} className="mx-auto mt-4 w-full max-w-[220px] md:max-w-none">
              <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                <span>
                  Format {format} · #{card.id}
                </span>
                {card.archetype &&
                  (onViewArchetype ? (
                    <button
                      onClick={() => onViewArchetype(card.archetype!)}
                      title="Xem các bài cùng archetype"
                      className="max-w-[55%] transition-transform active:scale-[0.97]"
                    >
                      <Badge
                        variant="secondary"
                        className="block truncate hover:bg-accent"
                      >
                        {card.archetype}
                      </Badge>
                    </button>
                  ) : (
                    <Badge variant="secondary" className="max-w-[55%] truncate">
                      {card.archetype}
                    </Badge>
                  ))}
              </div>
            </Rise>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-5 p-5 md:max-h-[90vh] md:overflow-y-auto md:p-7">
            <Rise index={1}>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {card.type} · {card.race}
              </p>
              <DialogTitle className="mt-1 text-2xl font-bold leading-tight tracking-tight">
                {card.name}
              </DialogTitle>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {card.attribute && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border py-0.5 pl-0.5 pr-2.5 text-xs font-medium">
                    <AttributeOrb attribute={card.attribute} size="sm" />
                    {card.attribute}
                  </span>
                )}
                {isLink && card.linkval !== undefined && (
                  <Badge variant="outline">Link-{card.linkval}</Badge>
                )}
              </div>
              {card.isCustom && (authorLoading || authorName) && (
                <div className="mt-2.5 flex items-center gap-2 text-sm">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <User className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                  {authorLoading ? (
                    <div className="shimmer-bg h-4 w-28 animate-pulse rounded" />
                  ) : (
                    <span className="min-w-0 truncate">
                      <span className="text-muted-foreground">{t("modal.author")} </span>
                      <span className="font-medium">{authorName}</span>
                      {card.customUserId !== undefined &&
                        card.customUserId === user?.id && (
                          <span className="text-muted-foreground"> {t("modal.you")}</span>
                        )}
                    </span>
                  )}
                </div>
              )}
            </Rise>

            {isMonster && (
              <Rise index={2}>
                <div className="flex flex-wrap divide-x divide-border border-y border-border">
                  {!isLink && card.level !== undefined && (
                    <StatCell
                      label={isXyz ? t("modal.rank") : t("modal.level")}
                      value={
                        <span className="flex items-center gap-0.5">
                          {Array.from({ length: Math.min(card.level, 12) }).map(
                            (_, i) => (
                              <Star
                                key={i}
                                className={
                                  isXyz
                                    ? "h-3.5 w-3.5 fill-zinc-900 text-amber-500 dark:fill-amber-400 dark:text-amber-400"
                                    : "h-3.5 w-3.5 fill-amber-400 text-amber-400"
                                }
                                strokeWidth={2}
                              />
                            )
                          )}
                          <span className="ml-1">{card.level}</span>
                        </span>
                      }
                    />
                  )}
                  {card.atk !== undefined && (
                    <StatCell label="ATK" value={card.atk} />
                  )}
                  {card.def !== undefined && !isLink && (
                    <StatCell label="DEF" value={card.def} />
                  )}
                  {isPendulum && card.scale !== undefined && (
                    <StatCell label="Scale" value={card.scale} />
                  )}
                </div>
              </Rise>
            )}

            {isLink && card.linkmarkers && card.linkmarkers.length > 0 && (
              <Rise index={3} className="flex items-center gap-4">
                <div className="grid shrink-0 grid-cols-3 gap-0.5 rounded-lg border border-border p-1.5">
                  {LINK_ARROWS.map(({ marker, Icon }, i) =>
                    marker === null ? (
                      <div
                        key={i}
                        className="flex h-7 w-7 items-center justify-center rounded bg-primary font-mono text-xs font-bold text-primary-foreground"
                      >
                        {card.linkval}
                      </div>
                    ) : (
                      <div
                        key={i}
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded",
                          card.linkmarkers?.includes(marker)
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground/30"
                        )}
                      >
                        {Icon && <Icon className="h-4 w-4" strokeWidth={2} />}
                      </div>
                    )
                  )}
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {card.linkmarkers.join(" · ")}
                </p>
              </Rise>
            )}

            <Rise index={3} className="space-y-2">
              <SectionLabel>{t("modal.cardText")}</SectionLabel>
              <p className="max-w-[65ch] whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {card.desc}
              </p>
            </Rise>

            {hasBanInfo && (
              <Rise index={4} className="space-y-2">
                <SectionLabel>{t("modal.banStatus")}</SectionLabel>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {[
                    { label: "TCG", status: tcgStatus },
                    { label: "OCG", status: ocgStatus },
                  ].map(({ label, status }) => (
                    <div key={label} className="flex items-center gap-2 text-sm">
                      <BanStatusBadge banStatus={status} size="sm" />
                      <span className="font-mono text-xs text-muted-foreground">
                        {label}
                      </span>
                      <span className="font-medium">
                        {status ?? t("modal.unlimited")}
                      </span>
                    </div>
                  ))}
                </div>
              </Rise>
            )}

            {visibleSets.length > 0 && (
              <Rise index={5} className="space-y-2">
                <SectionLabel>{t("modal.sets")}</SectionLabel>
                <ul className="divide-y divide-border border-y border-border">
                  {visibleSets.map((set, idx) => (
                    <li
                      key={`${set.set_code}-${idx}`}
                      className="flex items-center gap-3 py-2 text-sm"
                    >
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {set.set_code}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {set.set_name}
                      </span>
                      {set.set_rarity && (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {set.set_rarity}
                        </span>
                      )}
                      {set.set_price && Number(set.set_price) > 0 && (
                        <span className="shrink-0 font-mono text-xs tabular-nums">
                          ${set.set_price}
                        </span>
                      )}
                    </li>
                  ))}
                  {sets.length > visibleSets.length && (
                    <li className="py-2 text-xs text-muted-foreground">
                      {t("modal.moreSets", {
                        count: sets.length - visibleSets.length,
                      })}
                    </li>
                  )}
                </ul>
              </Rise>
            )}

            {price && (
              <Rise index={6} className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                {price.tcgplayer_price && Number(price.tcgplayer_price) > 0 && (
                  <span>
                    <span className="text-muted-foreground">TCGplayer </span>
                    <span className="font-mono font-medium tabular-nums">
                      ${price.tcgplayer_price}
                    </span>
                  </span>
                )}
                {price.cardmarket_price && Number(price.cardmarket_price) > 0 && (
                  <span>
                    <span className="text-muted-foreground">Cardmarket </span>
                    <span className="font-mono font-medium tabular-nums">
                      ${price.cardmarket_price}
                    </span>
                  </span>
                )}
              </Rise>
            )}

            <Rise index={7} className="mt-auto flex gap-2 pt-1">
              {card.archetype && onViewArchetype && (
                <Button
                  variant="outline"
                  className="flex-1 transition-transform active:scale-[0.98]"
                  onClick={() => onViewArchetype(card.archetype!)}
                >
                  <Layers className="mr-2 h-4 w-4" strokeWidth={2} />
                  {t("modal.relatedCards")}
                </Button>
              )}
              {onAddCard && (
                <Button
                  className="flex-1 transition-transform active:scale-[0.98]"
                  onClick={() => onAddCard(card)}
                >
                  <Plus className="mr-2 h-4 w-4" strokeWidth={2} />
                  {t("modal.addToDeck")}
                </Button>
              )}
              {card.ygoprodeck_url && (
                <Button variant="outline" size="icon" asChild>
                  <a
                    href={card.ygoprodeck_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("modal.openYgo")}
                  >
                    <ExternalLink className="h-4 w-4" strokeWidth={2} />
                  </a>
                </Button>
              )}
            </Rise>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

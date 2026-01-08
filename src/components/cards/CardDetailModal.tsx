import { YugiohCard } from "@/types/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { BanStatusBadge } from "./BanStatusBadge";
import { useBanList } from "@/hooks/useBanList";

interface CardDetailModalProps {
  card: YugiohCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCard?: (card: YugiohCard) => void;
}

export function CardDetailModal({
  card,
  open,
  onOpenChange,
  onAddCard,
}: CardDetailModalProps) {
  const { getBanStatus, loading: banListLoading } = useBanList();

  if (!card) return null;

  const isMonster = card.type.toLowerCase().includes("monster");
  const isLink = card.type.toLowerCase().includes("link");
  const isPendulum = card.type.toLowerCase().includes("pendulum");
  const banStatus = banListLoading ? null : getBanStatus(card.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{card.name}</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-[200px_1fr] gap-6">
          <div>
            <img
              src={card.card_images[0]?.image_url}
              alt={card.name}
              className="w-full rounded-lg shadow-md"
            />
            {onAddCard && (
              <Button className="w-full mt-3" onClick={() => onAddCard(card)}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm vào deck
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{card.type}</Badge>
              {card.attribute && (
                <Badge variant="outline">{card.attribute}</Badge>
              )}
              <Badge variant="outline">{card.race}</Badge>
              {card.archetype && <Badge>{card.archetype}</Badge>}
              <BanStatusBadge banStatus={banStatus} />
            </div>

            {isMonster && (
              <div className="flex gap-4 text-sm">
                {!isLink && card.level !== undefined && (
                  <div>
                    <span className="text-muted-foreground">Level: </span>
                    <span className="font-medium">{card.level}</span>
                  </div>
                )}
                {isLink && card.linkval !== undefined && (
                  <div>
                    <span className="text-muted-foreground">Link: </span>
                    <span className="font-medium">{card.linkval}</span>
                  </div>
                )}
                {card.atk !== undefined && (
                  <div>
                    <span className="text-muted-foreground">ATK: </span>
                    <span className="font-medium">{card.atk}</span>
                  </div>
                )}
                {card.def !== undefined && !isLink && (
                  <div>
                    <span className="text-muted-foreground">DEF: </span>
                    <span className="font-medium">{card.def}</span>
                  </div>
                )}
                {isPendulum && card.scale !== undefined && (
                  <div>
                    <span className="text-muted-foreground">Scale: </span>
                    <span className="font-medium">{card.scale}</span>
                  </div>
                )}
              </div>
            )}

            {isLink && card.linkmarkers && (
              <div className="text-sm">
                <span className="text-muted-foreground">Link Arrows: </span>
                <span>{card.linkmarkers.join(", ")}</span>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Mô tả
              </h4>
              <p className="text-sm whitespace-pre-wrap">{card.desc}</p>
            </div>

            {card.card_sets && card.card_sets.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Set
                </h4>
                <div className="flex flex-wrap gap-1">
                  {card.card_sets.slice(0, 5).map((set, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {set.set_code}
                    </Badge>
                  ))}
                  {card.card_sets.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{card.card_sets.length - 5} khác
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

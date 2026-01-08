import { YugiohCard, ExportSettings } from '@/types/card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye } from 'lucide-react';

interface PrintPreviewProps {
  cards: YugiohCard[];
  settings: ExportSettings;
}

export function PrintPreview({ cards, settings }: PrintPreviewProps) {
  const cardsPerPage = 9; // 3x3
  const pages = [];
  
  for (let i = 0; i < cards.length; i += cardsPerPage) {
    pages.push(cards.slice(i, i + cardsPerPage));
  }

  if (cards.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Xem trước trang in
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-[210/297] bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
            Thêm bài vào deck để xem trước
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Xem trước trang in ({pages.length} trang)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {pages.slice(0, 2).map((pageCards, pageIndex) => (
          <div
            key={pageIndex}
            className="aspect-[210/297] bg-white border rounded-lg p-4 shadow-sm"
          >
            <div className="grid grid-cols-3 gap-1 h-full">
              {pageCards.map((card, cardIndex) => (
                <div
                  key={`${card.id}-${cardIndex}`}
                  className="aspect-[59/86] overflow-hidden"
                >
                  <img
                    src={card.card_images[0]?.image_url_small}
                    alt={card.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {/* Fill empty slots */}
              {Array.from({ length: 9 - pageCards.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="aspect-[59/86] bg-muted/50 rounded"
                />
              ))}
            </div>
          </div>
        ))}
        {pages.length > 2 && (
          <p className="text-center text-sm text-muted-foreground">
            +{pages.length - 2} trang khác
          </p>
        )}
      </CardContent>
    </Card>
  );
}

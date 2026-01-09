import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { FileText, LogIn, Trash2, Clock, Download } from "lucide-react";
import {
  getUserDecks,
  getGenerationHistory,
  deleteDeck,
  SavedDeckRow,
} from "@/lib/deck-service";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GenerationHistoryItem {
  id: string;
  user_id: string;
  deck_name: string;
  card_count: number;
  export_format: string;
  created_at: string;
  deck_id: string | null;
}

export default function History() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [decks, setDecks] = useState<SavedDeckRow[]>([]);
  const [history, setHistory] = useState<GenerationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [decksData, historyData] = await Promise.all([
      getUserDecks(user.id),
      getGenerationHistory(user.id),
    ]);

    setDecks(decksData);
    setHistory(historyData);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user, loadData]);

  const handleDeleteDeck = async (deckId: string) => {
    const success = await deleteDeck(deckId);
    if (success) {
      setDecks(decks.filter((d) => d.id !== deckId));
      toast.success("Đã xóa deck");
    } else {
      toast.error("Có lỗi khi xóa");
    }
  };

  const handleLoadDeck = (deck: SavedDeckRow) => {
    sessionStorage.setItem("loadDeck", JSON.stringify(deck));
    navigate("/deck-builder");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12 px-4">
          <Card className="max-w-md mx-auto text-center">
            <CardHeader>
              <CardTitle>Đăng nhập để xem lịch sử</CardTitle>
              <CardDescription>
                Bạn cần đăng nhập để xem deck đã lưu và lịch sử xuất file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/auth">
                <Button>
                  <LogIn className="h-4 w-4 mr-2" />
                  Đăng nhập
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background ">
      <Header />
      <main className="container py-6 px-4">
        <h1 className="text-2xl font-bold mb-6">Deck & Lịch sử</h1>

        <Tabs defaultValue="decks">
          <TabsList>
            <TabsTrigger value="decks">Deck đã lưu</TabsTrigger>
            <TabsTrigger value="history">Lịch sử xuất</TabsTrigger>
          </TabsList>

          <TabsContent value="decks" className="mt-6">
            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-32 bg-muted animate-pulse rounded-lg"
                  />
                ))}
              </div>
            ) : decks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Chưa có deck nào được lưu</p>
                <Link to="/deck-builder">
                  <Button variant="outline" className="mt-4">
                    Tạo deck mới
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {decks.map((deck) => (
                  <Card
                    key={deck.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{deck.name}</CardTitle>
                      <CardDescription>
                        {deck.cards.reduce((sum, c) => sum + c.quantity, 0)} lá
                        bài
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {new Date(deck.updated_at).toLocaleDateString(
                            "vi-VN"
                          )}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleLoadDeck(deck)}
                          >
                            Mở
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteDeck(deck.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-muted animate-pulse rounded-lg"
                  />
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Chưa có lịch sử xuất file</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-card border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <Download className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{item.deck_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.card_count} lá bài
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">
                        {item.export_format.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

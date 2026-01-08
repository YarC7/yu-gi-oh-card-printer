import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { FileUpload } from '@/components/upload/FileUpload';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { parseYDKFile, parseJSONDeck, readFileAsText } from '@/lib/ydk-parser';
import { getCardsByIds } from '@/lib/ygoprodeck-api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Search, FileText, Printer } from 'lucide-react';

export default function Index() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileSelect = async (file: File) => {
    setLoading(true);
    try {
      const content = await readFileAsText(file);
      const isJSON = file.name.endsWith('.json');
      const parsed = isJSON ? parseJSONDeck(content) : parseYDKFile(content);
      
      const allIds = [...parsed.main, ...parsed.extra, ...parsed.side];
      
      if (allIds.length === 0) {
        toast.error('File không chứa ID bài hợp lệ');
        setLoading(false);
        return;
      }

      toast.success(`Đã tìm thấy ${allIds.length} lá bài, đang tải...`);
      
      const { cards, notFoundIds } = await getCardsByIds(allIds);
      
      // Store not found IDs to show warning
      if (notFoundIds.length > 0) {
        sessionStorage.setItem('notFoundCardIds', JSON.stringify(notFoundIds));
      } else {
        sessionStorage.removeItem('notFoundCardIds');
      }
      
      sessionStorage.setItem('importedDeck', JSON.stringify({ parsed, cards }));
      navigate('/deck-builder');
      
    } catch (error) {
      toast.error('Có lỗi khi đọc file');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold tracking-tight">
              YGO Proxy Printer
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Chuyển đổi file deck thành PDF/Word với kích thước chuẩn 5.9 x 8.6 cm, sẵn sàng để in
            </p>
          </div>

          <FileUpload 
            onFileSelect={handleFileSelect} 
            className={loading ? 'opacity-50 pointer-events-none' : ''} 
          />

          <div className="grid md:grid-cols-3 gap-4">
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow" 
              onClick={() => navigate('/search')}
            >
              <CardHeader className="pb-3">
                <Search className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Tìm kiếm bài</CardTitle>
                <CardDescription>
                  Tìm và thêm bài từ database với bộ lọc nâng cao
                </CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow" 
              onClick={() => navigate('/deck-builder')}
            >
              <CardHeader className="pb-3">
                <FileText className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Deck Builder</CardTitle>
                <CardDescription>
                  Xây dựng deck thủ công hoặc chỉnh sửa deck đã import
                </CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow" 
              onClick={() => navigate('/history')}
            >
              <CardHeader className="pb-3">
                <Printer className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Lịch sử</CardTitle>
                <CardDescription>
                  Xem lại các deck và file đã xuất trước đó
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

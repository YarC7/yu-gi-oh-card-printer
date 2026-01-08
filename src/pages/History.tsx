import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { FileText, LogIn } from 'lucide-react';

export default function History() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12">
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
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Lịch sử</h1>
        
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Chưa có lịch sử xuất file</p>
        </div>
      </main>
    </div>
  );
}

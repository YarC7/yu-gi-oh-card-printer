import { ExportSettings as Settings, DEFAULT_EXPORT_SETTINGS } from '@/types/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download } from 'lucide-react';

interface ExportSettingsProps {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
  onExport: () => void;
  loading?: boolean;
  cardCount: number;
}

export function ExportSettings({
  settings,
  onSettingsChange,
  onExport,
  loading,
  cardCount,
}: ExportSettingsProps) {
  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const handleReset = () => {
    onSettingsChange(DEFAULT_EXPORT_SETTINGS);
  };

  // Calculate pages needed
  const cardsPerPage = 9; // 3x3 grid
  const pagesNeeded = Math.ceil(cardCount / cardsPerPage);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Cài đặt xuất file
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Chiều rộng (cm)</Label>
              <Input
                type="number"
                step="0.1"
                value={settings.cardWidth}
                onChange={(e) => updateSetting('cardWidth', parseFloat(e.target.value) || 5.9)}
              />
            </div>
            <div className="space-y-2">
              <Label>Chiều cao (cm)</Label>
              <Input
                type="number"
                step="0.1"
                value={settings.cardHeight}
                onChange={(e) => updateSetting('cardHeight', parseFloat(e.target.value) || 8.6)}
              />
            </div>
          </div>

          <div>
            <Label className="mb-3 block">Định dạng xuất</Label>
            <RadioGroup
              value={settings.format}
              onValueChange={(v) => updateSetting('format', v as 'docx' | 'pdf')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="cursor-pointer">PDF</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="docx" id="docx" />
                <Label htmlFor="docx" className="cursor-pointer">Word (.docx)</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="pt-4 border-t space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Số lá bài:</span>
            <span className="font-medium">{cardCount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Số trang:</span>
            <span className="font-medium">{pagesNeeded}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Kích thước:</span>
            <span className="font-medium">{settings.cardWidth} x {settings.cardHeight} cm</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1"
          >
            Đặt lại
          </Button>
          <Button
            onClick={onExport}
            disabled={loading || cardCount === 0}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            {loading ? 'Đang tạo...' : 'Xuất file'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

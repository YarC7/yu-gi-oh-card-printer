import { ExportSettings as Settings, DEFAULT_EXPORT_SETTINGS } from '@/types/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Download } from 'lucide-react';

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
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Chiều rộng (cm)</Label>
          <Input
            type="number"
            step="0.1"
            value={settings.cardWidth}
            onChange={(e) => updateSetting('cardWidth', parseFloat(e.target.value) || 5.9)}
            className="h-8"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Chiều cao (cm)</Label>
          <Input
            type="number"
            step="0.1"
            value={settings.cardHeight}
            onChange={(e) => updateSetting('cardHeight', parseFloat(e.target.value) || 8.6)}
            className="h-8"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs mb-2 block">Định dạng</Label>
        <RadioGroup
          value={settings.format}
          onValueChange={(v) => updateSetting('format', v as 'docx' | 'pdf')}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="pdf" id="pdf" />
            <Label htmlFor="pdf" className="text-sm cursor-pointer">PDF</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="docx" id="docx" />
            <Label htmlFor="docx" className="text-sm cursor-pointer">Word</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{cardCount} bài • {pagesNeeded} trang</span>
        <span>{settings.cardWidth} x {settings.cardHeight} cm</span>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="flex-1"
        >
          Reset
        </Button>
        <Button
          size="sm"
          onClick={onExport}
          disabled={loading || cardCount === 0}
          className="flex-1"
        >
          <Download className="h-4 w-4 mr-1.5" />
          {loading ? 'Đang tạo...' : 'Xuất file'}
        </Button>
      </div>
    </div>
  );
}

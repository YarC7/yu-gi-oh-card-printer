import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { YugiohCard } from '@/types/card';
import { toast } from 'sonner';
import { ImageOff } from 'lucide-react';

interface AddCustomCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCard: (card: YugiohCard, section: 'main' | 'extra' | 'side') => void;
}

export function AddCustomCardModal({ open, onOpenChange, onAddCard }: AddCustomCardModalProps) {
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [type, setType] = useState('Effect Monster');
  const [section, setSection] = useState<'main' | 'extra' | 'side'>('main');
  const [desc, setDesc] = useState('');
  const [imagePreviewError, setImagePreviewError] = useState(false);

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên bài');
      return;
    }

    // Create a custom card with negative ID to distinguish from API cards
    const customCard: YugiohCard = {
      id: -Date.now(), // Negative ID for custom cards
      name: name.trim(),
      type,
      frameType: type.toLowerCase().includes('spell') ? 'spell' : 
                 type.toLowerCase().includes('trap') ? 'trap' : 'effect',
      desc: desc || 'Custom pre-release card',
      race: 'Unknown',
      card_images: imageUrl.trim() ? [{
        id: -Date.now(),
        image_url: imageUrl.trim(),
        image_url_small: imageUrl.trim(),
        image_url_cropped: imageUrl.trim(),
      }] : [],
    };

    onAddCard(customCard, section);
    toast.success(`Đã thêm "${name}" vào ${section === 'main' ? 'Main Deck' : section === 'extra' ? 'Extra Deck' : 'Side Deck'}`);
    
    // Reset form
    setName('');
    setImageUrl('');
    setDesc('');
    setImagePreviewError(false);
    onOpenChange(false);
  };

  const handleImageUrlChange = (url: string) => {
    setImageUrl(url);
    setImagePreviewError(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm bài Pre-release / Custom</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên bài *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên bài..."
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">URL hình ảnh</Label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => handleImageUrlChange(e.target.value)}
              placeholder="https://example.com/card.jpg"
              type="url"
            />
            {imageUrl && (
              <div className="mt-2 flex justify-center">
                <div className="relative w-24 h-35 rounded-md overflow-hidden bg-muted aspect-[59/86]">
                  {imagePreviewError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                      <ImageOff className="h-6 w-6" />
                      <span className="text-xs mt-1">Lỗi tải</span>
                    </div>
                  ) : (
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={() => setImagePreviewError(true)}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Loại bài</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Effect Monster">Effect Monster</SelectItem>
                  <SelectItem value="Normal Monster">Normal Monster</SelectItem>
                  <SelectItem value="Fusion Monster">Fusion Monster</SelectItem>
                  <SelectItem value="Synchro Monster">Synchro Monster</SelectItem>
                  <SelectItem value="XYZ Monster">XYZ Monster</SelectItem>
                  <SelectItem value="Link Monster">Link Monster</SelectItem>
                  <SelectItem value="Pendulum Effect Monster">Pendulum Monster</SelectItem>
                  <SelectItem value="Ritual Monster">Ritual Monster</SelectItem>
                  <SelectItem value="Spell Card">Spell Card</SelectItem>
                  <SelectItem value="Trap Card">Trap Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Thêm vào</Label>
              <Select value={section} onValueChange={(v) => setSection(v as 'main' | 'extra' | 'side')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">Main Deck</SelectItem>
                  <SelectItem value="extra">Extra Deck</SelectItem>
                  <SelectItem value="side">Side Deck</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Mô tả (tuỳ chọn)</Label>
            <Textarea
              id="desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Nhập hiệu ứng bài..."
              rows={3}
              maxLength={500}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button onClick={handleSubmit}>
            Thêm bài
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

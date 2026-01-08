import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { YugiohCard } from '@/types/card';
import { useAuth } from '@/hooks/useAuth';
import { createCustomCard, customCardToYugiohCard } from '@/lib/custom-cards-service';
import { toast } from 'sonner';
import { ImageOff, Upload, Loader2 } from 'lucide-react';
import { CARD_TYPES, CARD_ATTRIBUTES, MONSTER_RACES } from '@/lib/ygoprodeck-api';

interface AddCustomCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCard: (card: YugiohCard, section: 'main' | 'extra' | 'side') => void;
}

export function AddCustomCardModal({ open, onOpenChange, onAddCard }: AddCustomCardModalProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState('');
  const [type, setType] = useState('Effect Monster');
  const [section, setSection] = useState<'main' | 'extra' | 'side'>('main');
  const [desc, setDesc] = useState('');
  const [attribute, setAttribute] = useState('');
  const [race, setRace] = useState('');
  const [level, setLevel] = useState<string>('');
  const [atk, setAtk] = useState<string>('');
  const [def, setDef] = useState<string>('');
  const [linkVal, setLinkVal] = useState<string>('');
  const [scale, setScale] = useState<string>('');
  const [archetype, setArchetype] = useState('');
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const [saving, setSaving] = useState(false);

  const isMonster = !type.toLowerCase().includes('spell') && !type.toLowerCase().includes('trap');
  const isLink = type.toLowerCase().includes('link');
  const isPendulum = type.toLowerCase().includes('pendulum');
  const isExtraDeck = type.toLowerCase().includes('fusion') || 
                      type.toLowerCase().includes('synchro') || 
                      type.toLowerCase().includes('xyz') || 
                      type.toLowerCase().includes('link');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File quá lớn. Tối đa 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setImagePreviewError(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên bài');
      return;
    }

    if (!user) {
      toast.error('Vui lòng đăng nhập để lưu bài custom');
      return;
    }

    setSaving(true);
    try {
      const result = await createCustomCard(user.id, {
        name: name.trim(),
        type,
        description: desc || undefined,
        attribute: attribute || undefined,
        race: race || undefined,
        level: level ? parseInt(level) : undefined,
        atk: atk ? parseInt(atk) : undefined,
        def: def ? parseInt(def) : undefined,
        linkVal: linkVal ? parseInt(linkVal) : undefined,
        scale: scale ? parseInt(scale) : undefined,
        archetype: archetype || undefined,
        imageFile: imageFile || undefined,
      });

      if (result) {
        const card = customCardToYugiohCard(result);
        const targetSection = isExtraDeck ? 'extra' : section;
        onAddCard(card, targetSection);
        toast.success(`Đã lưu và thêm "${name}" vào deck`);
        resetForm();
        onOpenChange(false);
      } else {
        toast.error('Có lỗi khi lưu bài');
      }
    } catch (error) {
      console.error(error);
      toast.error('Có lỗi khi lưu bài');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setName('');
    setType('Effect Monster');
    setSection('main');
    setDesc('');
    setAttribute('');
    setRace('');
    setLevel('');
    setAtk('');
    setDef('');
    setLinkVal('');
    setScale('');
    setArchetype('');
    setImageFile(null);
    setImagePreview('');
    setImagePreviewError(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm bài Pre-release / Custom</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Card Name */}
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

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Hình ảnh</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex gap-4 items-start">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0"
              >
                <Upload className="h-4 w-4 mr-2" />
                Chọn ảnh
              </Button>
              
              {imagePreview && (
                <div className="relative w-20 h-28 rounded-md overflow-hidden bg-muted">
                  {imagePreviewError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                      <ImageOff className="h-5 w-5" />
                    </div>
                  ) : (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={() => setImagePreviewError(true)}
                    />
                  )}
                </div>
              )}
            </div>
            {imageFile && (
              <p className="text-xs text-muted-foreground">{imageFile.name}</p>
            )}
          </div>

          {/* Card Type */}
          <div className="space-y-2">
            <Label>Loại bài</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {CARD_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Monster-specific fields */}
          {isMonster && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Attribute</Label>
                  <Select value={attribute} onValueChange={setAttribute}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CARD_ATTRIBUTES.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Race/Type</Label>
                  <Select value={race} onValueChange={setRace}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {MONSTER_RACES.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {!isLink && (
                  <div className="space-y-2">
                    <Label>Level/Rank</Label>
                    <Input
                      type="number"
                      min={1}
                      max={12}
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      placeholder="1-12"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>ATK</Label>
                  <Input
                    type="number"
                    min={0}
                    value={atk}
                    onChange={(e) => setAtk(e.target.value)}
                    placeholder="0"
                  />
                </div>

                {isLink ? (
                  <div className="space-y-2">
                    <Label>Link Value</Label>
                    <Input
                      type="number"
                      min={1}
                      max={6}
                      value={linkVal}
                      onChange={(e) => setLinkVal(e.target.value)}
                      placeholder="1-6"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>DEF</Label>
                    <Input
                      type="number"
                      min={0}
                      value={def}
                      onChange={(e) => setDef(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                )}
              </div>

              {isPendulum && (
                <div className="space-y-2">
                  <Label>Pendulum Scale</Label>
                  <Input
                    type="number"
                    min={0}
                    max={13}
                    value={scale}
                    onChange={(e) => setScale(e.target.value)}
                    placeholder="0-13"
                  />
                </div>
              )}
            </>
          )}

          {/* Archetype */}
          <div className="space-y-2">
            <Label>Archetype (tuỳ chọn)</Label>
            <Input
              value={archetype}
              onChange={(e) => setArchetype(e.target.value)}
              placeholder="VD: Blue-Eyes, Dark Magician..."
              maxLength={50}
            />
          </div>

          {/* Section to add */}
          {!isExtraDeck && (
            <div className="space-y-2">
              <Label>Thêm vào</Label>
              <Select value={section} onValueChange={(v) => setSection(v as 'main' | 'extra' | 'side')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">Main Deck</SelectItem>
                  <SelectItem value="side">Side Deck</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {isExtraDeck && (
            <p className="text-xs text-muted-foreground">
              * Bài {type} sẽ tự động thêm vào Extra Deck
            </p>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label>Mô tả / Hiệu ứng</Label>
            <Textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Nhập hiệu ứng bài..."
              rows={4}
              maxLength={1000}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Huỷ
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !user}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              'Lưu & Thêm'
            )}
          </Button>
        </DialogFooter>

        {!user && (
          <p className="text-xs text-destructive text-center">
            Vui lòng đăng nhập để lưu bài custom
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

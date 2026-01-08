import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FilterMenu, CardFilterState, DEFAULT_FILTER_STATE, CARD_TYPE_FILTERS, ATTRIBUTE_FILTERS, MONSTER_TYPE_FILTERS } from './FilterMenu';
import { YugiohCard } from '@/types/card';
import { useAuth } from '@/hooks/useAuth';
import { createCustomCard, customCardToYugiohCard } from '@/lib/custom-cards-service';
import { toast } from 'sonner';
import { ImageOff, Upload, Loader2, Filter } from 'lucide-react';

interface AddCustomCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCard: (card: YugiohCard, section: 'main' | 'extra' | 'side') => void;
}

export function AddCustomCardModal({ open, onOpenChange, onAddCard }: AddCustomCardModalProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savingRef = useRef(false);
  
  // Basic info
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [archetype, setArchetype] = useState('');
  const [section, setSection] = useState<'main' | 'extra' | 'side'>('main');
  
  // Filter-based selection
  const [filters, setFilters] = useState<CardFilterState>(DEFAULT_FILTER_STATE);
  
  // Image
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const [saving, setSaving] = useState(false);

  // Derive card properties from filters
  const getCardType = (): string => {
    const types = filters.cardTypes;
    if (types.includes('Spell')) return 'Spell Card';
    if (types.includes('Trap')) return 'Trap Card';
    
    // Build monster type string
    let typeStr = '';
    
    if (types.includes('Pendulum')) {
      if (types.includes('Normal')) typeStr = 'Pendulum Normal Monster';
      else if (types.includes('Effect') || types.length === 1) typeStr = 'Pendulum Effect Monster';
      else if (types.includes('Fusion')) typeStr = 'Pendulum Fusion Monster';
      else if (types.includes('Synchro')) typeStr = 'Synchro Pendulum Effect Monster';
      else if (types.includes('Xyz')) typeStr = 'XYZ Pendulum Effect Monster';
      else typeStr = 'Pendulum Effect Monster';
    } else if (types.includes('Link')) {
      typeStr = 'Link Monster';
    } else if (types.includes('Xyz')) {
      typeStr = 'XYZ Monster';
    } else if (types.includes('Synchro')) {
      if (filters.specialTypes.includes('Tuner')) typeStr = 'Synchro Tuner Monster';
      else typeStr = 'Synchro Monster';
    } else if (types.includes('Fusion')) {
      typeStr = 'Fusion Monster';
    } else if (types.includes('Ritual')) {
      if (types.includes('Effect')) typeStr = 'Ritual Effect Monster';
      else typeStr = 'Ritual Monster';
    } else if (types.includes('Normal')) {
      typeStr = 'Normal Monster';
    } else if (types.includes('Effect')) {
      if (filters.specialTypes.includes('Tuner')) typeStr = 'Tuner Monster';
      else if (filters.specialTypes.includes('Flip')) typeStr = 'Flip Effect Monster';
      else if (filters.specialTypes.includes('Spirit')) typeStr = 'Spirit Monster';
      else if (filters.specialTypes.includes('Union')) typeStr = 'Union Effect Monster';
      else if (filters.specialTypes.includes('Gemini')) typeStr = 'Gemini Monster';
      else if (filters.specialTypes.includes('Toon')) typeStr = 'Toon Monster';
      else typeStr = 'Effect Monster';
    } else {
      typeStr = 'Effect Monster';
    }
    
    return typeStr;
  };

  const isExtraDeck = (): boolean => {
    const types = filters.cardTypes;
    return types.includes('Fusion') || types.includes('Synchro') || 
           types.includes('Xyz') || types.includes('Link');
  };

  const isLink = filters.cardTypes.includes('Link');
  const isPendulum = filters.cardTypes.includes('Pendulum');
  const isSpellTrap = filters.cardTypes.includes('Spell') || filters.cardTypes.includes('Trap');

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

    savingRef.current = true;
    setSaving(true);
    try {
      const cardType = getCardType();
      const result = await createCustomCard(user.id, {
        name: name.trim(),
        type: cardType,
        description: desc || undefined,
        attribute: filters.attributes[0] || undefined,
        race: filters.monsterTypes[0] || undefined,
        level: filters.levelMin || undefined,
        atk: filters.atkMin || undefined,
        def: filters.defMin || undefined,
        linkVal: filters.linkValue || undefined,
        scale: filters.scaleMin || undefined,
        archetype: archetype || undefined,
        imageFile: imageFile || undefined,
      });

      if (result) {
        const card = customCardToYugiohCard(result);
        const targetSection = isExtraDeck() ? 'extra' : section;
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
      savingRef.current = false;
      setSaving(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDesc('');
    setArchetype('');
    setSection('main');
    setFilters(DEFAULT_FILTER_STATE);
    setImageFile(null);
    setImagePreview('');
    setImagePreviewError(false);
  };

  // Get summary of selected filters
  const getFilterSummary = (): string => {
    const parts: string[] = [];
    if (filters.cardTypes.length) parts.push(filters.cardTypes.join(', '));
    if (filters.attributes.length) parts.push(filters.attributes.join(', '));
    if (filters.monsterTypes.length) parts.push(filters.monsterTypes[0] + (filters.monsterTypes.length > 1 ? '...' : ''));
    return parts.join(' | ') || 'Chưa chọn';
  };

  // Prevent closing dialog while saving
  const handleOpenChange = (newOpen: boolean) => {
    if (savingRef.current) return;
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onPointerDownOutside={(e) => savingRef.current && e.preventDefault()}
        onEscapeKeyDown={(e) => savingRef.current && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Thêm bài Pre-release / Custom</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="basic">Thông tin cơ bản</TabsTrigger>
            <TabsTrigger value="filters" className="gap-2">
              <Filter className="h-4 w-4" />
              Thuộc tính ({filters.cardTypes.length + filters.attributes.length + filters.monsterTypes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="flex-1 overflow-y-auto space-y-4 mt-4">
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

            {/* Selected filters summary */}
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Thuộc tính đã chọn:</p>
              <p className="text-sm text-muted-foreground">{getFilterSummary()}</p>
              {filters.atkMin !== undefined && (
                <p className="text-xs text-muted-foreground">ATK: {filters.atkMin}</p>
              )}
              {filters.defMin !== undefined && !isLink && (
                <p className="text-xs text-muted-foreground">DEF: {filters.defMin}</p>
              )}
              {filters.levelMin !== undefined && !isLink && (
                <p className="text-xs text-muted-foreground">Level/Rank: {filters.levelMin}</p>
              )}
              {filters.linkValue !== undefined && isLink && (
                <p className="text-xs text-muted-foreground">Link: {filters.linkValue}</p>
              )}
              {filters.scaleMin !== undefined && isPendulum && (
                <p className="text-xs text-muted-foreground">Scale: {filters.scaleMin}</p>
              )}
            </div>

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
            {!isExtraDeck() && !isSpellTrap && (
              <div className="space-y-2">
                <Label>Thêm vào</Label>
                <div className="flex gap-2">
                  {['main', 'side'].map((s) => (
                    <Button
                      key={s}
                      type="button"
                      variant={section === s ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSection(s as 'main' | 'side')}
                    >
                      {s === 'main' ? 'Main Deck' : 'Side Deck'}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {isExtraDeck() && (
              <p className="text-xs text-muted-foreground">
                * Bài này sẽ tự động thêm vào Extra Deck
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
          </TabsContent>

          <TabsContent value="filters" className="flex-1 overflow-hidden mt-4">
            <FilterMenu
              filters={filters}
              onChange={setFilters}
              showActions={false}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={resetForm} disabled={saving}>
            Reset
          </Button>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={saving}>
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

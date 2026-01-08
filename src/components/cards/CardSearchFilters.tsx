import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { CardSearchFilters as Filters } from '@/types/card';
import { CARD_TYPES, CARD_ATTRIBUTES, MONSTER_RACES } from '@/lib/ygoprodeck-api';
import { Search, RotateCcw, Loader2 } from 'lucide-react';

interface CardSearchFiltersProps {
  onSearch: (filters: Filters) => void;
  loading?: boolean;
}

export function CardSearchFilters({ onSearch, loading }: CardSearchFiltersProps) {
  const [filters, setFilters] = useState<Filters>({});
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const onSearchRef = useRef(onSearch);
  
  // Keep ref updated
  onSearchRef.current = onSearch;

  // Debounced search on filter change
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Only auto-search if we have a name with 2+ chars or other filters
    const hasNameFilter = filters.name && filters.name.length >= 2;
    const hasOtherFilters = filters.type || filters.attribute || filters.race || filters.level;
    
    if (hasNameFilter || hasOtherFilters) {
      debounceRef.current = setTimeout(() => {
        onSearchRef.current(filters);
      }, 400);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [filters]);

  const handleReset = () => {
    setFilters({});
  };

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            placeholder="Tìm theo tên hoặc mô tả bài..."
            value={filters.name || ''}
            onChange={(e) => updateFilter('name', e.target.value)}
            className="pr-10"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <Button variant="outline" onClick={handleReset} disabled={loading}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="advanced">
          <AccordionTrigger className="text-sm">
            Bộ lọc nâng cao
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
              <div className="space-y-2">
                <Label>Loại bài</Label>
                <Select
                  value={filters.type || ''}
                  onValueChange={(v) => updateFilter('type', v || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tất cả</SelectItem>
                    {CARD_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Thuộc tính</Label>
                <Select
                  value={filters.attribute || ''}
                  onValueChange={(v) => updateFilter('attribute', v || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tất cả</SelectItem>
                    {CARD_ATTRIBUTES.map((attr) => (
                      <SelectItem key={attr} value={attr}>
                        {attr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Chủng loại</Label>
                <Select
                  value={filters.race || ''}
                  onValueChange={(v) => updateFilter('race', v || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tất cả</SelectItem>
                    {MONSTER_RACES.map((race) => (
                      <SelectItem key={race} value={race}>
                        {race}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Level/Rank</Label>
                <Select
                  value={filters.level?.toString() || ''}
                  onValueChange={(v) => updateFilter('level', v ? parseInt(v) : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tất cả</SelectItem>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((lvl) => (
                      <SelectItem key={lvl} value={lvl.toString()}>
                        {lvl}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>ATK (tối thiểu)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.atkMin || ''}
                  onChange={(e) => updateFilter('atkMin', e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>

              <div className="space-y-2">
                <Label>DEF (tối thiểu)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.defMin || ''}
                  onChange={(e) => updateFilter('defMin', e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

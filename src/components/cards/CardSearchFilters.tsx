import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FilterMenu, CardFilterState, DEFAULT_FILTER_STATE } from './FilterMenu';
// Using Sheet component for filter panel - no Accordion/Select components
import { CardSearchFilters as Filters } from '@/types/card';
import { Search, RotateCcw, Loader2, Filter, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

interface CardSearchFiltersProps {
  onSearch: (filters: Filters) => void;
  loading?: boolean;
}

// Convert CardFilterState to API Filters
function convertFiltersToAPI(state: CardFilterState, name?: string): Filters {
  const filters: Filters = {};
  
  if (name && name.trim()) {
    filters.name = name.trim();
  }

  // Card type - prioritize specific types
  if (state.cardTypes.length > 0) {
    const types = state.cardTypes;
    
    // Build the type string for API
    if (types.includes('Spell')) {
      filters.type = 'Spell Card';
    } else if (types.includes('Trap')) {
      filters.type = 'Trap Card';
    } else if (types.includes('Link')) {
      filters.type = 'Link Monster';
    } else if (types.includes('Xyz')) {
      filters.type = types.includes('Pendulum') ? 'XYZ Pendulum Effect Monster' : 'XYZ Monster';
    } else if (types.includes('Synchro')) {
      filters.type = types.includes('Pendulum') ? 'Synchro Pendulum Effect Monster' : 'Synchro Monster';
    } else if (types.includes('Fusion')) {
      filters.type = 'Fusion Monster';
    } else if (types.includes('Ritual')) {
      filters.type = types.includes('Effect') ? 'Ritual Effect Monster' : 'Ritual Monster';
    } else if (types.includes('Pendulum')) {
      filters.type = types.includes('Normal') ? 'Pendulum Normal Monster' : 'Pendulum Effect Monster';
    } else if (types.includes('Normal')) {
      filters.type = 'Normal Monster';
    } else if (types.includes('Effect')) {
      filters.type = 'Effect Monster';
    }
  }

  // Attribute
  if (state.attributes.length === 1) {
    filters.attribute = state.attributes[0];
  }

  // Race (monster type)
  if (state.monsterTypes.length === 1) {
    filters.race = state.monsterTypes[0];
  }

  // Level
  if (state.levelMin !== undefined) {
    filters.level = state.levelMin;
  }

  // ATK
  if (state.atkMin !== undefined) {
    filters.atkMin = state.atkMin;
  }

  // DEF
  if (state.defMin !== undefined) {
    filters.defMin = state.defMin;
  }

  return filters;
}

export function CardSearchFilters({ onSearch, loading }: CardSearchFiltersProps) {
  const [name, setName] = useState('');
  const [filterState, setFilterState] = useState<CardFilterState>(DEFAULT_FILTER_STATE);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const onSearchRef = useRef(onSearch);
  
  // Keep ref updated
  onSearchRef.current = onSearch;

  // Count active filters
  const activeFilterCount = 
    filterState.cardTypes.length + 
    filterState.attributes.length + 
    filterState.monsterTypes.length + 
    filterState.specialTypes.length +
    (filterState.levelMin !== undefined ? 1 : 0) +
    (filterState.atkMin !== undefined ? 1 : 0) +
    (filterState.defMin !== undefined ? 1 : 0);

  // Debounced search on filter/name change
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const hasNameFilter = name && name.length >= 2;
    const hasOtherFilters = activeFilterCount > 0;
    
    if (hasNameFilter || hasOtherFilters) {
      debounceRef.current = setTimeout(() => {
        const apiFilters = convertFiltersToAPI(filterState, name);
        onSearchRef.current(apiFilters);
      }, 400);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [name, filterState, activeFilterCount]);

  const handleReset = () => {
    setName('');
    setFilterState(DEFAULT_FILTER_STATE);
  };

  const handleConfirmFilters = () => {
    setIsFilterOpen(false);
    const apiFilters = convertFiltersToAPI(filterState, name);
    onSearchRef.current(apiFilters);
  };

  // Get quick filter badges
  const getQuickBadges = () => {
    const badges: { label: string; onRemove: () => void }[] = [];
    
    filterState.cardTypes.forEach(type => {
      badges.push({
        label: type,
        onRemove: () => setFilterState(prev => ({
          ...prev,
          cardTypes: prev.cardTypes.filter(t => t !== type)
        }))
      });
    });

    filterState.attributes.forEach(attr => {
      badges.push({
        label: attr,
        onRemove: () => setFilterState(prev => ({
          ...prev,
          attributes: prev.attributes.filter(a => a !== attr)
        }))
      });
    });

    filterState.monsterTypes.slice(0, 2).forEach(type => {
      badges.push({
        label: type,
        onRemove: () => setFilterState(prev => ({
          ...prev,
          monsterTypes: prev.monsterTypes.filter(t => t !== type)
        }))
      });
    });

    if (filterState.monsterTypes.length > 2) {
      badges.push({
        label: `+${filterState.monsterTypes.length - 2} more`,
        onRemove: () => setFilterState(prev => ({ ...prev, monsterTypes: [] }))
      });
    }

    return badges;
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên hoặc mô tả bài..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="pl-10 pr-10"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Bộ lọc
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>Filter Menu</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterMenu
                filters={filterState}
                onChange={setFilterState}
                onConfirm={handleConfirmFilters}
                onCancel={() => setIsFilterOpen(false)}
                onReset={() => setFilterState(DEFAULT_FILTER_STATE)}
              />
            </div>
          </SheetContent>
        </Sheet>

        <Button variant="outline" onClick={handleReset} disabled={loading}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick filter badges */}
      {getQuickBadges().length > 0 && (
        <div className="flex flex-wrap gap-2">
          {getQuickBadges().map((badge, i) => (
            <Badge 
              key={i} 
              variant="secondary" 
              className="gap-1 cursor-pointer hover:bg-destructive/20"
              onClick={badge.onRemove}
            >
              {badge.label}
              <X className="h-3 w-3" />
            </Badge>
          ))}
          {activeFilterCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs"
              onClick={handleReset}
            >
              Xoá tất cả
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

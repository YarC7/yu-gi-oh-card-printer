import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

// Card Types
export const CARD_TYPE_FILTERS = [
  'Normal', 'Effect', 'Fusion', 'Ritual', 'Synchro', 'Xyz', 'Pendulum', 'Link', 'Spell', 'Trap'
] as const;

// Attributes
export const ATTRIBUTE_FILTERS = [
  'LIGHT', 'DARK', 'WATER', 'FIRE', 'EARTH', 'WIND', 'DIVINE'
] as const;

// Spell/Trap Types
export const SPELL_TRAP_TYPES = [
  'Normal Spell', 'Field Spell', 'Equip Spell', 'Continuous Spell', 
  'Quick-Play Spell', 'Ritual Spell', 'Normal Trap', 'Continuous Trap', 'Counter Trap'
] as const;

// Monster Types (Race)
export const MONSTER_TYPE_FILTERS = [
  'Spellcaster', 'Dragon', 'Zombie', 'Warrior', 'Beast-Warrior', 'Beast', 
  'Winged Beast', 'Machine', 'Fiend', 'Fairy', 'Insect', 'Dinosaur',
  'Reptile', 'Fish', 'Sea Serpent', 'Aqua', 'Pyro', 'Thunder', 'Rock', 'Plant',
  'Psychic', 'Wyrm', 'Cyberse', 'Illusion', 'Divine-Beast', 'Creator God'
] as const;

// Special Types
export const SPECIAL_TYPE_FILTERS = [
  'Toon', 'Gemini', 'Union', 'Spirit', 'Tuner', 'Flip', 'Special Summon', 'Non-Effect'
] as const;

export interface CardFilterState {
  cardTypes: string[];
  attributes: string[];
  spellTrapTypes: string[];
  monsterTypes: string[];
  specialTypes: string[];
  levelMin?: number;
  levelMax?: number;
  atkMin?: number;
  atkMax?: number;
  defMin?: number;
  defMax?: number;
  scaleMin?: number;
  scaleMax?: number;
  linkValue?: number;
}

interface FilterMenuProps {
  filters: CardFilterState;
  onChange: (filters: CardFilterState) => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  onReset?: () => void;
  showActions?: boolean;
  className?: string;
}

interface FilterToggleProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

function FilterToggle({ label, selected, onClick }: FilterToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 text-sm rounded border-2 transition-all font-medium',
        'bg-card hover:bg-accent',
        selected 
          ? 'border-primary text-primary shadow-[0_0_8px_hsl(var(--primary)/0.4)]' 
          : 'border-border text-foreground'
      )}
    >
      {label}
    </button>
  );
}

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
}

function FilterSection({ title, children }: FilterSectionProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
        {title}
      </h4>
      <div className="flex flex-wrap gap-2">
        {children}
      </div>
    </div>
  );
}

export function FilterMenu({ 
  filters, 
  onChange, 
  onConfirm, 
  onCancel, 
  onReset,
  showActions = true,
  className 
}: FilterMenuProps) {
  const toggleFilter = (
    category: keyof Pick<CardFilterState, 'cardTypes' | 'attributes' | 'spellTrapTypes' | 'monsterTypes' | 'specialTypes'>,
    value: string
  ) => {
    const current = filters[category];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    onChange({ ...filters, [category]: updated });
  };

  const updateNumericFilter = (
    key: keyof Pick<CardFilterState, 'levelMin' | 'levelMax' | 'atkMin' | 'atkMax' | 'defMin' | 'defMax' | 'scaleMin' | 'scaleMax' | 'linkValue'>,
    value: string
  ) => {
    const numValue = value === '' ? undefined : parseInt(value);
    onChange({ ...filters, [key]: numValue });
  };

  // Check if Spell or Trap is selected
  const isSpellTrapSelected = filters.cardTypes.some(t => 
    t === 'Spell' || t === 'Trap'
  );

  // Check if any monster type is selected
  const isMonsterSelected = filters.cardTypes.some(t => 
    !['Spell', 'Trap'].includes(t)
  ) || filters.cardTypes.length === 0;

  return (
    <div className={cn('space-y-4', className)}>
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {/* Card Type */}
          <FilterSection title="Card Type">
            {CARD_TYPE_FILTERS.map(type => (
              <FilterToggle
                key={type}
                label={type}
                selected={filters.cardTypes.includes(type)}
                onClick={() => toggleFilter('cardTypes', type)}
              />
            ))}
          </FilterSection>

          <Separator />

          {/* Attribute */}
          <FilterSection title="Attribute">
            {ATTRIBUTE_FILTERS.map(attr => (
              <FilterToggle
                key={attr}
                label={attr}
                selected={filters.attributes.includes(attr)}
                onClick={() => toggleFilter('attributes', attr)}
              />
            ))}
          </FilterSection>

          <Separator />

          {/* Spell/Trap Types - only show if Spell or Trap is selected */}
          {isSpellTrapSelected && (
            <>
              <FilterSection title="Spell/Trap Type">
                {SPELL_TRAP_TYPES.map(type => (
                  <FilterToggle
                    key={type}
                    label={type}
                    selected={filters.spellTrapTypes.includes(type)}
                    onClick={() => toggleFilter('spellTrapTypes', type)}
                  />
                ))}
              </FilterSection>
              <Separator />
            </>
          )}

          {/* Monster Type (Race) */}
          {isMonsterSelected && (
            <>
              <FilterSection title="Monster Type">
                {MONSTER_TYPE_FILTERS.map(type => (
                  <FilterToggle
                    key={type}
                    label={type}
                    selected={filters.monsterTypes.includes(type)}
                    onClick={() => toggleFilter('monsterTypes', type)}
                  />
                ))}
              </FilterSection>

              <Separator />

              <FilterSection title="Special Abilities">
                {SPECIAL_TYPE_FILTERS.map(type => (
                  <FilterToggle
                    key={type}
                    label={type}
                    selected={filters.specialTypes.includes(type)}
                    onClick={() => toggleFilter('specialTypes', type)}
                  />
                ))}
              </FilterSection>

              <Separator />
            </>
          )}

          {/* Numeric Values */}
          <FilterSection title="Stats">
            <div className="w-full grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Level/Rank</label>
                <div className="flex gap-1">
                  <Input
                    type="number"
                    placeholder="Min"
                    min={1}
                    max={12}
                    value={filters.levelMin ?? ''}
                    onChange={(e) => updateNumericFilter('levelMin', e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    min={1}
                    max={12}
                    value={filters.levelMax ?? ''}
                    onChange={(e) => updateNumericFilter('levelMax', e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">ATK</label>
                <div className="flex gap-1">
                  <Input
                    type="number"
                    placeholder="Min"
                    min={0}
                    value={filters.atkMin ?? ''}
                    onChange={(e) => updateNumericFilter('atkMin', e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    min={0}
                    value={filters.atkMax ?? ''}
                    onChange={(e) => updateNumericFilter('atkMax', e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">DEF</label>
                <div className="flex gap-1">
                  <Input
                    type="number"
                    placeholder="Min"
                    min={0}
                    value={filters.defMin ?? ''}
                    onChange={(e) => updateNumericFilter('defMin', e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    min={0}
                    value={filters.defMax ?? ''}
                    onChange={(e) => updateNumericFilter('defMax', e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Pendulum Scale</label>
                <div className="flex gap-1">
                  <Input
                    type="number"
                    placeholder="Min"
                    min={0}
                    max={13}
                    value={filters.scaleMin ?? ''}
                    onChange={(e) => updateNumericFilter('scaleMin', e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    min={0}
                    max={13}
                    value={filters.scaleMax ?? ''}
                    onChange={(e) => updateNumericFilter('scaleMax', e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Link Value</label>
                <Input
                  type="number"
                  placeholder="Link"
                  min={1}
                  max={6}
                  value={filters.linkValue ?? ''}
                  onChange={(e) => updateNumericFilter('linkValue', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </FilterSection>
        </div>
      </ScrollArea>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-2 pt-2 border-t">
          {onReset && (
            <Button variant="outline" size="sm" onClick={onReset}>
              Reset
            </Button>
          )}
          <div className="flex-1" />
          {onCancel && (
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
          {onConfirm && (
            <Button size="sm" onClick={onConfirm}>
              Confirm
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export const DEFAULT_FILTER_STATE: CardFilterState = {
  cardTypes: [],
  attributes: [],
  spellTrapTypes: [],
  monsterTypes: [],
  specialTypes: [],
};

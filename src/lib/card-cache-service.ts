import { supabase } from '@/integrations/supabase/client';
import { YugiohCard, CardSearchFilters } from '@/types/card';

const API_BASE = "https://db.ygoprodeck.com/api/v7";
const SYNC_INTERVAL_DAYS = 7;

interface CardInfoResponse {
  data: YugiohCard[];
}

interface CacheMetadata {
  lastSyncAt: string;
  cardCount: number;
}

interface CachedCardRow {
  id: number;
  name: string;
  type: string;
  frame_type: string;
  desc: string;
  atk: number | null;
  def: number | null;
  level: number | null;
  race: string;
  attribute: string | null;
  archetype: string | null;
  linkval: number | null;
  linkmarkers: string[] | null;
  scale: number | null;
  ygoprodeck_url: string | null;
  card_images: { id: number; image_url: string; image_url_small: string; image_url_cropped: string }[];
  created_at: string;
  updated_at: string;
}

interface SearchResult {
  cards: YugiohCard[];
  totalCount: number;
  hasMore: boolean;
  source: 'cache' | 'api';
  suggestions?: string[];
}

// LocalStorage keys
const CACHE_META_KEY = 'ygo_card_cache_meta';
const SEARCH_HISTORY_KEY = 'ygo_search_history';

function shouldRefreshCache(): boolean {
  const meta = localStorage.getItem(CACHE_META_KEY);
  if (!meta) return true;

  try {
    const parsed: CacheMetadata = JSON.parse(meta);
    const lastSync = new Date(parsed.lastSyncAt);
    const daysSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceSync >= SYNC_INTERVAL_DAYS;
  } catch {
    return true;
  }
}

function updateCacheMetadata(cardCount: number): void {
  const meta: CacheMetadata = {
    lastSyncAt: new Date().toISOString(),
    cardCount,
  };
  localStorage.setItem(CACHE_META_KEY, JSON.stringify(meta));
}

function cardToRow(card: YugiohCard): Record<string, unknown> {
  return {
    id: card.id,
    name: card.name,
    type: card.type,
    frame_type: card.frameType,
    "desc": card.desc,
    atk: card.atk ?? null,
    def: card.def ?? null,
    level: card.level ?? null,
    race: card.race,
    attribute: card.attribute ?? null,
    archetype: card.archetype ?? null,
    linkval: card.linkval ?? null,
    linkmarkers: card.linkmarkers ?? null,
    scale: card.scale ?? null,
    ygoprodeck_url: card.ygoprodeck_url ?? null,
    card_images: card.card_images,
  };
}

function rowToCard(row: CachedCardRow): YugiohCard {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    frameType: row.frame_type,
    desc: row.desc,
    atk: row.atk ?? undefined,
    def: row.def ?? undefined,
    level: row.level ?? undefined,
    race: row.race,
    attribute: row.attribute ?? undefined,
    archetype: row.archetype ?? undefined,
    linkval: row.linkval ?? undefined,
    linkmarkers: row.linkmarkers ?? undefined,
    scale: row.scale ?? undefined,
    ygoprodeck_url: row.ygoprodeck_url ?? undefined,
    card_images: row.card_images,
  };
}

async function fetchAllCardsFromAPI(): Promise<YugiohCard[]> {
  const cards: YugiohCard[] = [];
  let offset = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `${API_BASE}/cardinfo.php?num=${batchSize}&offset=${offset}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = (await response.json()) as CardInfoResponse;
    const batchCards = data.data || [];

    if (batchCards.length === 0) {
      hasMore = false;
      break;
    }

    cards.push(...batchCards);
    offset += batchCards.length;

    if (batchCards.length < batchSize) {
      hasMore = false;
    }

    if (hasMore) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return cards;
}

async function checkCacheExists(): Promise<boolean> {
  const { count, error } = await supabase
    .from('cached_cards')
    .select('*', { count: 'exact', head: true });

  if (error) {
    if (error.message?.includes('does not exist')) {
      return false;
    }
    console.error('Error checking cache:', error);
    return false;
  }

  return (count ?? 0) > 0;
}

export async function syncCardsToCache(): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    console.log('Starting card cache sync...');
    const cards = await fetchAllCardsFromAPI();
    console.log(`Fetched ${cards.length} cards from API`);

    if (cards.length === 0) {
      return { success: false, count: 0, error: 'No cards fetched from API' };
    }

    await supabase.from('cached_cards').delete().neq('id', 0);

    const batchSize = 100;
    for (let i = 0; i < cards.length; i += batchSize) {
      const batch = cards.slice(i, i + batchSize).map(cardToRow);
      
      const { error } = await supabase
        .from('cached_cards')
        .upsert(batch, { onConflict: 'id', ignoreDuplicates: false });

      if (error) {
        console.error('Error upserting batch:', error);
      }

      if (i + batchSize < cards.length) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    updateCacheMetadata(cards.length);
    console.log(`Successfully cached ${cards.length} cards`);

    return { success: true, count: cards.length };
  } catch (error) {
    console.error('Error syncing cards:', error);
    return { success: false, count: 0, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get search suggestions using FTS for better matching
 */
export async function getSearchSuggestions(partial: string, limit: number = 5): Promise<string[]> {
  if (!partial || partial.length < 2) return [];

  try {
    const searchTerm = partial.toLowerCase();
    
    // Use FTS for suggestions when available, fallback to ilike
    const { data, error } = await supabase
      .from('cached_cards')
      .select('name')
      .or(`name.fts.${searchTerm},name.ilike.%${searchTerm}%`)
      .limit(limit * 3);

    if (error) {
      // Fallback to simple ilike if FTS not available
      const { data: fallbackData } = await supabase
        .from('cached_cards')
        .select('name')
        .ilike('name', `%${searchTerm}%`)
        .limit(limit * 2);
      
      const names = (fallbackData || []).map(row => (row as { name: string }).name);
      return processSuggestions(names, searchTerm, limit);
    }

    const names = (data || []).map(row => (row as { name: string }).name);
    return processSuggestions(names, searchTerm, limit);
  } catch (error) {
    console.error('Error getting suggestions:', error);
    return [];
  }
}

function processSuggestions(names: string[], searchTerm: string, limit: number): string[] {
  const uniqueNames = Array.from(new Set(names));
  
  const sorted = uniqueNames.sort((a, b) => {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    const aStarts = aLower.startsWith(searchTerm);
    const bStarts = bLower.startsWith(searchTerm);
    
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    if (aStarts && bStarts) {
      return a.length - b.length;
    }
    
    // Check for whole word match
    const aWord = new RegExp(`\\\\b${searchTerm}\\\\b`, 'i').test(a);
    const bWord = new RegExp(`\\\\b${searchTerm}\\\\b`, 'i').test(b);
    if (aWord && !bWord) return -1;
    if (!aWord && bWord) return 1;
    
    return a.length - b.length;
  });

  return sorted.slice(0, limit);
}

/**
 * Advanced search using PostgreSQL Full-Text Search
 */
export async function searchCardsAdvanced(
  filters: CardSearchFilters,
  options?: {
    limit?: number;
    offset?: number;
    includeSuggestions?: boolean;
  }
): Promise<SearchResult> {
  const {
    limit = 50,
    offset = 0,
    includeSuggestions = true
  } = options ?? {};

  const keyword = filters.name?.trim();

  const cacheExists = await checkCacheExists();
  if (!cacheExists) {
    syncCardsToCache().catch(console.error);
    return { cards: [], totalCount: 0, hasMore: false, source: 'api' };
  }

  try {
    let query;

    if (keyword && keyword.length >= 2) {
      // Use Full-Text Search for text queries
      const { data, error, count } = await supabase
        .rpc('search_cards_tsquery', {
          search_query: keyword,
          result_limit: limit,
          result_offset: offset
        });

      if (!error && data) {
        const cards = (data as unknown[]).map((row: unknown) => rowToCard(row as CachedCardRow));
        
        // Get total count for FTS results
        const { count: totalCount } = await supabase
          .from('cached_cards')
          .select('*', { count: 'exact', head: true })
          .textSearch('name', keyword);

        let suggestions: string[] | undefined;
        if (includeSuggestions) {
          suggestions = await getSearchSuggestions(keyword);
        }

        return {
          cards,
          totalCount: totalCount || cards.length,
          hasMore: offset + cards.length < (totalCount || 0),
          source: 'cache',
          suggestions,
        };
      }
    }

    // Fallback to regular query builder for non-FTS searches or if FTS fails
    return searchCardsQueryBuilder(filters, limit, offset, includeSuggestions);
  } catch (error) {
    console.error('Error in searchCardsAdvanced:', error);
    return searchCardsQueryBuilder(filters, limit, offset, includeSuggestions);
  }
}

/**
 * Fallback query builder for filtered searches
 */
async function searchCardsQueryBuilder(
  filters: CardSearchFilters,
  limit: number,
  offset: number,
  includeSuggestions: boolean
): Promise<SearchResult> {
  const keyword = filters.name?.trim();
  
  let query = supabase
    .from('cached_cards')
    .select('*', { count: 'exact' });

  if (keyword && keyword.length >= 2) {
    query = query.or(`name.ilike.%${keyword}%`);
  }

  if (filters.type) {
    query = query.eq('type', filters.type);
  }

  if (filters.attribute) {
    query = query.eq('attribute', filters.attribute);
  }

  if (filters.race) {
    query = query.eq('race', filters.race);
  }

  if (filters.level !== undefined) {
    query = query.eq('level', filters.level);
  }

  if (filters.atkMin !== undefined) {
    query = query.gte('atk', filters.atkMin);
  }

  if (filters.defMin !== undefined) {
    query = query.gte('def', filters.defMin);
  }

  if (filters.archetype) {
    query = query.ilike('archetype', `%${filters.archetype}%`);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error searching cache:', error);
    return { cards: [], totalCount: 0, hasMore: false, source: 'cache' };
  }

  let cards = (data as CachedCardRow[] || []).map(rowToCard);
  const totalCount = count || 0;

  // Manual ranking for non-FTS searches
  if (keyword && cards.length > 0) {
    cards = cards
      .map(card => ({
        card,
        score: calculateRelevance(card, keyword)
      }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.card);
  }

  let suggestions: string[] | undefined;
  if (includeSuggestions && keyword) {
    suggestions = await getSearchSuggestions(keyword);
  }

  return {
    cards,
    totalCount,
    hasMore: offset + cards.length < totalCount,
    source: 'cache',
    suggestions,
  };
}

/**
 * Calculate search relevance score
 */
function calculateRelevance(card: YugiohCard, searchTerm: string): number {
  const term = searchTerm.toLowerCase();
  const name = card.name.toLowerCase();
  const desc = card.desc?.toLowerCase() || '';
  
  let score = 0;
  
  if (name === term) {
    score += 1000;
  } else if (name.startsWith(term)) {
    score += 500;
  } else if (new RegExp(`\\\\b${term}\\\\b`, 'i').test(name)) {
    score += 300;
  } else if (name.includes(term)) {
    score += 100;
  }
  
  if (desc.includes(term)) {
    score += 10;
  }
  
  if (card.archetype) {
    score += 5;
  }
  
  return score;
}

export async function getCardFromCache(id: number): Promise<YugiohCard | null> {
  try {
    const { data, error } = await supabase
      .from('cached_cards')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return rowToCard(data as CachedCardRow);
  } catch (error) {
    console.error('Error getting card from cache:', error);
    return null;
  }
}

export async function getCardsFromCache(ids: number[]): Promise<YugiohCard[]> {
  if (ids.length === 0) return [];

  try {
    const { data, error } = await supabase
      .from('cached_cards')
      .select('*')
      .in('id', ids);

    if (error) {
      console.error('Error getting cards from cache:', error);
      return [];
    }

    return (data as CachedCardRow[] || []).map(rowToCard);
  } catch (error) {
    console.error('Error getting cards from cache:', error);
    return [];
  }
}

export async function getCacheStats(): Promise<{ 
  cardCount: number; 
  lastSyncAt: string | null; 
  needsRefresh: boolean;
}> {
  const { count, error } = await supabase
    .from('cached_cards')
    .select('*', { count: 'exact', head: true });

  const meta = localStorage.getItem(CACHE_META_KEY);
  let lastSyncAt: string | null = null;

  if (meta) {
    try {
      const parsed: CacheMetadata = JSON.parse(meta);
      lastSyncAt = parsed.lastSyncAt;
    } catch {
      // Ignore parse error
    }
  }

  return {
    cardCount: count || 0,
    lastSyncAt,
    needsRefresh: shouldRefreshCache(),
  };
}

export function addToSearchHistory(query: string): void {
  if (!query || query.length < 2) return;
  
  const history = getSearchHistory();
  const newHistory = [query, ...history.filter(h => h.toLowerCase() !== query.toLowerCase())].slice(0, 10);
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
}

export function getSearchHistory(): string[] {
  try {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
}

export function clearSearchHistory(): void {
  localStorage.removeItem(SEARCH_HISTORY_KEY);
}

export async function clearCardCache(): Promise<void> {
  localStorage.removeItem(CACHE_META_KEY);
  await supabase.from('cached_cards').delete().neq('id', 0);
}

export { CACHE_META_KEY, SEARCH_HISTORY_KEY };

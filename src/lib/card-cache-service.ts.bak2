import { supabase } from '@/integrations/supabase/client';
import { YugiohCard } from '@/types/card';

const API_BASE = "https://db.ygoprodeck.com/api/v7";
const SYNC_INTERVAL_DAYS = 7; // Re-sync every 7 days
const BATCH_SIZE = 500; // Number of cards to fetch per batch

interface CardInfoResponse {
  data: YugiohCard[];
}

interface CacheMetadata {
  lastSyncAt: string;
  cardCount: number;
}

// Type for the cached_cards table row
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

// LocalStorage keys for cache management
const CACHE_META_KEY = 'ygo_card_cache_meta';
const LAST_SEARCH_RESULTS_KEY = 'ygo_last_search_results';

/**
 * Check if the cached cards need to be refreshed
 */
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

/**
 * Update cache metadata in localStorage
 */
function updateCacheMetadata(cardCount: number): void {
  const meta: CacheMetadata = {
    lastSyncAt: new Date().toISOString(),
    cardCount,
  };
  localStorage.setItem(CACHE_META_KEY, JSON.stringify(meta));
}

/**
 * Fetch all cards from YGOPRODeck API
 */
async function fetchAllCardsFromAPI(): Promise<YugiohCard[]> {
  const cards: YugiohCard[] = [];
  let offset = 0;
  const batchSize = 1000; // API allows up to 1000 per request
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

    // If we got less than batch size, we've reached the end
    if (batchCards.length < batchSize) {
      hasMore = false;
    }

    // Small delay to be nice to the API
    if (hasMore) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return cards;
}

/**
 * Transform YugiohCard to database row format
 */
function cardToRow(card: YugiohCard): Record<string, unknown> {
  return {
    id: card.id,
    name: card.name,
    type: card.type,
    frame_type: card.frameType,
    desc: card.desc,
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

/**
 * Transform database row to YugiohCard
 */
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

/**
 * Sync all cards from API to Supabase
 * This should be called periodically (e.g., once per week)
 */
export async function syncCardsToCache(): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    console.log('Starting card cache sync...');

    // Fetch all cards from API
    const cards = await fetchAllCardsFromAPI();
    console.log(`Fetched ${cards.length} cards from API`);

    if (cards.length === 0) {
      return { success: false, count: 0, error: 'No cards fetched from API' };
    }

    // Upsert cards in batches
    const batchSize = 100;
    for (let i = 0; i < cards.length; i += batchSize) {
      const batch = cards.slice(i, i + batchSize).map(cardToRow);
      
      const { error } = await supabase
        .from('cached_cards')
        .upsert(batch, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error upserting batch:', error);
        // Continue with next batch
      }

      // Small delay between batches
      if (i + batchSize < cards.length) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    // Update metadata
    updateCacheMetadata(cards.length);
    console.log(`Successfully cached ${cards.length} cards`);

    return { success: true, count: cards.length };
  } catch (error) {
    console.error('Error syncing cards:', error);
    return { 
      success: false, 
      count: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Check if cached_cards table exists and has data
 */
async function checkCacheExists(): Promise<boolean> {
  const { count, error } = await supabase
    .from('cached_cards')
    .select('*', { count: 'exact', head: true });

  if (error) {
    // Table might not exist yet
    if (error.message?.includes('does not exist')) {
      return false;
    }
    console.error('Error checking cache:', error);
    return false;
  }

  return (count ?? 0) > 0;
}

/**
 * Search cards from Supabase cache
 */
export async function searchCardsFromCache(
  keyword?: string,
  filters?: {
    type?: string;
    attribute?: string;
    race?: string;
    level?: number;
  },
  limit: number = 50,
  offset: number = 0
): Promise<{ cards: YugiohCard[]; totalCount: number; hasMore: boolean }> {
  try {
    // Check if cache needs initialization
    const cacheExists = await checkCacheExists();
    if (!cacheExists || shouldRefreshCache()) {
      // Trigger background sync (don't wait for it)
      syncCardsToCache().catch(console.error);
      
      // Return empty if no cache yet - will fall back to API
      if (!cacheExists) {
        return { cards: [], totalCount: 0, hasMore: false };
      }
    }

    let query = supabase
      .from('cached_cards')
      .select('*', { count: 'exact' });

    // Apply keyword filter (search name and description)
    if (keyword && keyword.trim().length >= 2) {
      const searchTerm = keyword.trim().toLowerCase();
      query = query.or(`name.ilike.%${searchTerm}%,desc.ilike.%${searchTerm}%`);
    }

    // Apply type filter
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    // Apply attribute filter
    if (filters?.attribute) {
      query = query.eq('attribute', filters.attribute);
    }

    // Apply race filter
    if (filters?.race) {
      query = query.eq('race', filters.race);
    }

    // Apply level filter
    if (filters?.level !== undefined) {
      query = query.eq('level', filters.level);
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error searching cache:', error);
      return { cards: [], totalCount: 0, hasMore: false };
    }

    const cards = (data as CachedCardRow[] || []).map(rowToCard);
    const totalCount = count || 0;

    return {
      cards,
      totalCount,
      hasMore: offset + cards.length < totalCount,
    };
  } catch (error) {
    console.error('Error in searchCardsFromCache:', error);
    return { cards: [], totalCount: 0, hasMore: false };
  }
}

/**
 * Get a single card by ID from cache
 */
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

/**
 * Get multiple cards by IDs from cache
 */
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

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{ 
  cardCount: number; 
  lastSyncAt: string | null; 
  needsRefresh: boolean 
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

/**
 * Clear the cache (useful for debugging or force refresh)
 */
export async function clearCardCache(): Promise<void> {
  localStorage.removeItem(CACHE_META_KEY);
  localStorage.removeItem(LAST_SEARCH_RESULTS_KEY);
  
  // Note: This only clears metadata. The actual data stays in Supabase
  // until the next sync overwrites it.
}

// Export cache metadata key for external use
export { CACHE_META_KEY, LAST_SEARCH_RESULTS_KEY };

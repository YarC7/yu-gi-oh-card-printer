import { YugiohCard, CardSearchFilters, BanListInfo } from "@/types/card";
import { searchCardsFromCache, syncCardsToCache, getCardFromCache, getCardsFromCache, getCacheStats } from "./card-cache-service";

const API_BASE = "https://db.ygoprodeck.com/api/v7";

// Request deduplication cache for in-flight requests
const inFlightRequests = new Map<string, Promise<unknown>>();

// Track if we're currently syncing
let isSyncing = false;

// API Client with caching, retry, and rate limiting
class YGOProDeckAPIClient {
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second
  private readonly RATE_LIMIT_DELAY = 50; // 50ms between requests (reduced from 100ms)
  private lastRequestTime = 0;

  private async makeRequest(
    url: string,
    retries = this.MAX_RETRIES,
    signal?: AbortSignal
  ): Promise<unknown> {
    // Check for abort before starting
    if (signal?.aborted) {
      throw new Error('Request aborted');
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.RATE_LIMIT_DELAY - timeSinceLastRequest)
      );
    }
    this.lastRequestTime = Date.now();

    // Check cache first
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await fetch(url, { signal });

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited, wait longer and retry
          if (retries > 0) {
            await new Promise((resolve) =>
              setTimeout(resolve, this.RETRY_DELAY * 2)
            );
            return this.makeRequest(url, retries - 1, signal);
          }
          throw new Error(`Rate limited: ${response.status}`);
        }

        if (response.status >= 500 && retries > 0) {
          // Server error, retry with exponential backoff
          await new Promise((resolve) =>
            setTimeout(
              resolve,
              this.RETRY_DELAY * (this.MAX_RETRIES - retries + 1)
            )
          );
          return this.makeRequest(url, retries - 1, signal);
        }

        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Cache the result
      this.cache.set(url, { data, timestamp: Date.now() });

      return data;
    } catch (error) {
      if (signal?.aborted) {
        throw new Error('Request aborted');
      }
      if (retries > 0 && (error as Error).message.includes("fetch")) {
        // Network error, retry
        await new Promise((resolve) => setTimeout(resolve, this.RETRY_DELAY));
        return this.makeRequest(url, retries - 1, signal);
      }
      throw error;
    }
  }

  async get(endpoint: string, signal?: AbortSignal): Promise<unknown> {
    const url = `${API_BASE}${endpoint}`;
    
    // Check for deduplication - if same request is in flight, return it
    const existingRequest = inFlightRequests.get(url);
    if (existingRequest) {
      return existingRequest;
    }

    // Create new request and track it
    const request = this.makeRequest(url, this.MAX_RETRIES, signal);
    inFlightRequests.set(url, request);

    try {
      const result = await request;
      return result;
    } finally {
      // Clean up in-flight request after it completes
      inFlightRequests.delete(url);
    }
  }

  // Clear cache method for manual cache invalidation
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

const apiClient = new YGOProDeckAPIClient();

interface BanlistCardData {
  id: number;
  banlist_info?: {
    ban_tcg?: string;
    ban_ocg?: string;
    ban_goat?: string;
  };
}

interface CardInfoResponse {
  data: YugiohCard[];
  meta?: {
    total_rows: number;
  };
}

interface BanListResponse {
  data: BanlistCardData[];
}

/**
 * Convert CardSearchFilters to cache filters format
 */
function toCacheFilters(filters: CardSearchFilters): {
  type?: string;
  attribute?: string;
  race?: string;
  level?: number;
} {
  return {
    type: filters.type,
    attribute: filters.attribute,
    race: filters.race,
    level: filters.level,
  };
}

export async function searchCards(
  filters: CardSearchFilters,
  page: number = 1,
  pageSize: number = 50,
  signal?: AbortSignal
): Promise<{ cards: YugiohCard[]; totalCount: number; hasMore: boolean; source: 'cache' | 'api' }> {
  const keyword = filters.name?.trim();
  const offset = (page - 1) * pageSize;

  // First, try to search from cache
  const cacheResults = await searchCardsFromCache(
    keyword,
    toCacheFilters(filters),
    pageSize,
    offset
  );

  // If we have cache results, return them
  if (cacheResults.cards.length > 0 || await isCacheReady()) {
    return {
      ...cacheResults,
      source: 'cache',
    };
  }

  // Fallback to API if cache is not ready
  try {
    const apiResults = await searchCardsFromAPI(filters, page, pageSize, signal);
    
    // Trigger background sync if cache is not ready
    if (!isSyncing && !await isCacheReady()) {
      isSyncing = true;
      syncCardsToCache().finally(() => {
        isSyncing = false;
      });
    }

    return {
      ...apiResults,
      source: 'api',
    };
  } catch (error) {
    if ((error as Error).message === 'Request aborted') {
      throw error;
    }
    console.error("API search error:", error);
    return { cards: [], totalCount: 0, hasMore: false, source: 'api' };
  }
}

/**
 * Check if cache is ready (has data)
 */
async function isCacheReady(): Promise<boolean> {
  const stats = await getCacheStats();
  return stats.cardCount > 0;
}

async function searchCardsFromAPI(
  filters: CardSearchFilters,
  page: number,
  pageSize: number,
  signal?: AbortSignal
): Promise<{ cards: YugiohCard[]; totalCount: number; hasMore: boolean }> {
  const keyword = filters.name?.trim();

  // If we have a keyword, search both by name and description separately then merge
  if (keyword && keyword.length >= 2) {
    try {
      // Run name and description searches in parallel
      const [nameResults, descResults] = await Promise.all([
        searchByParams(
          { ...filters, searchType: "name" },
          page,
          pageSize,
          signal
        ).catch(() => ({ cards: [] as YugiohCard[], totalCount: 0, hasMore: false })),
        searchByParams(
          { ...filters, searchType: "desc", num: pageSize },
          page,
          pageSize,
          signal
        ).catch(() => ({ cards: [] as YugiohCard[], totalCount: 0, hasMore: false })),
      ]);

      // Merge and deduplicate results
      const seen = new Set<number>();
      const merged: YugiohCard[] = [];

      // Prioritize name results first
      for (const card of nameResults.cards) {
        if (!seen.has(card.id)) {
          seen.add(card.id);
          merged.push(card);
        }
      }
      
      // Add desc results if we need more
      for (const card of descResults.cards) {
        if (!seen.has(card.id)) {
          seen.add(card.id);
          merged.push(card);
        }
      }

      return {
        cards: merged.slice(0, pageSize),
        totalCount: nameResults.totalCount + descResults.totalCount,
        hasMore: merged.length >= pageSize,
      };
    } catch (error) {
      if ((error as Error).message === 'Request aborted') {
        throw error;
      }
      console.error("Search error:", error);
      return { cards: [], totalCount: 0, hasMore: false };
    }
  }

  // No keyword, use regular filtered search
  return searchByParams(filters, page, pageSize, signal);
}

function searchByParams(
  filters: CardSearchFilters & { searchType?: "name" | "desc"; num?: number },
  page: number,
  pageSize: number,
  signal?: AbortSignal
): Promise<{ cards: YugiohCard[]; totalCount: number; hasMore: boolean }> {
  const params = new URLSearchParams();

  // Handle search type (fname for name, desc for description)
  if (filters.name && filters.name.trim()) {
    const searchTerm = filters.name.trim();
    if (filters.searchType === "desc") {
      params.set("desc", searchTerm);
    } else {
      params.set("fname", searchTerm);
    }
  }

  // Card type filter
  if (filters.type) {
    params.set("type", filters.type);
  }

  // Attribute filter
  if (filters.attribute) {
    params.set("attribute", filters.attribute);
  }

  // Race filter (monster type or spell/trap type)
  if (filters.race) {
    params.set("race", filters.race);
  }

  // Level filter
  if (filters.level !== undefined && filters.level !== null) {
    params.set("level", String(filters.level));
  }

  // ATK filters
  if (filters.atkMin !== undefined && filters.atkMin !== null) {
    params.set("atk", String(filters.atkMin));
  }

  // DEF filters
  if (filters.defMin !== undefined && filters.defMin !== null) {
    params.set("def", String(filters.defMin));
  }

  // Archetype filter
  if (filters.archetype) {
    params.set("archetype", filters.archetype);
  }

  // Pagination - YGOPRODeck uses num and offset
  const num = filters.num || pageSize;
  const offset = (page - 1) * pageSize;
  params.set("num", String(num));
  params.set("offset", String(offset));

  const url = `/cardinfo.php?${params.toString()}`;
  
  // Check in-flight deduplication
  const existingRequest = inFlightRequests.get(url) as Promise<CardInfoResponse> | undefined;
  if (existingRequest) {
    return existingRequest.then((data) => ({
      cards: data.data || [],
      totalCount: data.meta?.total_rows || (data.data || []).length,
      hasMore: offset + (data.data || []).length < (data.meta?.total_rows || 0),
    }));
  }

  const request = apiClient.get(url, signal) as Promise<CardInfoResponse>;
  inFlightRequests.set(url, request);

  return request
    .then((data) => {
      const cards = data.data || [];
      const totalRows = data.meta?.total_rows || cards.length;

      return {
        cards,
        totalCount: totalRows,
        hasMore: offset + cards.length < totalRows,
      };
    })
    .finally(() => {
      inFlightRequests.delete(url);
    });
}

export async function getCardById(id: number): Promise<YugiohCard | null> {
  // Try cache first
  const cached = await getCardFromCache(id);
  if (cached) return cached;

  // Fallback to API
  try {
    const data = (await apiClient.get(
      `/cardinfo.php?id=${id}`
    )) as CardInfoResponse;
    return data.data?.[0] || null;
  } catch (error) {
    console.error("Error fetching card:", error);
    return null;
  }
}

export interface GetCardsByIdsResult {
  cards: YugiohCard[];
  notFoundIds: number[];
}

export async function getCardsByIds(
  ids: number[]
): Promise<GetCardsByIdsResult> {
  if (ids.length === 0) return { cards: [], notFoundIds: [] };

  // Try cache first
  const cachedCards = await getCardsFromCache(ids);
  const foundIds = new Set(cachedCards.map((c) => c.id));
  const missingIds = ids.filter((id) => !foundIds.has(id));

  // If all found in cache, return immediately
  if (missingIds.length === 0) {
    return { cards: cachedCards, notFoundIds: [] };
  }

  // Fetch missing IDs from API
  const batchSize = 50;
  const results: YugiohCard[] = [...cachedCards];

  for (let i = 0; i < missingIds.length; i += batchSize) {
    const batch = missingIds.slice(i, i + batchSize);
    const idsParam = batch.join(",");

    try {
      const data = (await apiClient.get(
        `/cardinfo.php?id=${idsParam}`
      )) as CardInfoResponse;
      if (data.data) {
        results.push(...data.data);
      }
    } catch (error) {
      console.error("Error fetching cards batch:", error);
    }
  }

  // Find IDs that weren't found
  const finalFoundIds = new Set(results.map((c) => c.id));
  const notFoundIds = ids.filter((id) => !finalFoundIds.has(id));

  return { cards: results, notFoundIds };
}

export async function getBanList(): Promise<BanListInfo[]> {
  try {
    // Fetch both TCG and OCG ban lists
    const [tcgData, ocgData] = await Promise.all([
      apiClient.get("/cardinfo.php?banlist=tcg") as Promise<BanListResponse>,
      apiClient.get("/cardinfo.php?banlist=ocg") as Promise<BanListResponse>,
    ]);

    const banListMap = new Map<number, BanListInfo>();

    // Process TCG data
    tcgData.data?.forEach((card: BanlistCardData) => {
      if (card.banlist_info?.ban_tcg) {
        banListMap.set(card.id, {
          cardId: card.id,
          ban_tcg: normalizeBanStatus(card.banlist_info.ban_tcg),
          ban_ocg: undefined,
          ban_goat: card.banlist_info.ban_goat
            ? normalizeBanStatus(card.banlist_info.ban_goat)
            : undefined,
        });
      }
    });

    // Process OCG data and merge
    ocgData.data?.forEach((card: BanlistCardData) => {
      if (card.banlist_info?.ban_ocg) {
        const existing = banListMap.get(card.id);
        if (existing) {
          existing.ban_ocg = normalizeBanStatus(card.banlist_info.ban_ocg);
        } else {
          banListMap.set(card.id, {
            cardId: card.id,
            ban_tcg: undefined,
            ban_ocg: normalizeBanStatus(card.banlist_info.ban_ocg),
            ban_goat: card.banlist_info.ban_goat
              ? normalizeBanStatus(card.banlist_info.ban_goat)
              : undefined,
          });
        }
      }
    });

    return Array.from(banListMap.values());
  } catch (error) {
    console.error("Error fetching ban list:", error);
    return [];
  }
}

function normalizeBanStatus(
  status: string
): "Forbidden" | "Limited" | "Semi-Limited" {
  if (status === "Forbidden") return "Forbidden";
  return status as "Forbidden" | "Limited" | "Semi-Limited";
}

interface ArchetypeResponse {
  archetype_name: string;
}

export async function getAllArchetypes(): Promise<string[]> {
  try {
    const data = (await apiClient.get(
      "/archetypes.php"
    )) as ArchetypeResponse[];
    return data.map((a) => a.archetype_name);
  } catch (error) {
    console.error("Error fetching archetypes:", error);
    return [];
  }
}

export const CARD_TYPES = [
  "Effect Monster",
  "Flip Effect Monster",
  "Fusion Monster",
  "Link Monster",
  "Normal Monster",
  "Pendulum Effect Monster",
  "Pendulum Flip Effect Monster",
  "Pendulum Normal Monster",
  "Pendulum Tuner Effect Monster",
  "Ritual Effect Monster",
  "Ritual Monster",
  "Spell Card",
  "Spirit Monster",
  "Synchro Monster",
  "Synchro Pendulum Effect Monster",
  "Synchro Tuner Monster",
  "Trap Card",
  "Tuner Monster",
  "Union Effect Monster",
  "XYZ Monster",
  "XYZ Pendulum Effect Monster",
];

export const CARD_ATTRIBUTES = [
  "DARK",
  "DIVINE",
  "EARTH",
  "FIRE",
  "LIGHT",
  "WATER",
  "WIND",
];

export const MONSTER_RACES = [
  "Aqua",
  "Beast",
  "Beast-Warrior",
  "Cyberse",
  "Dinosaur",
  "Divine-Beast",
  "Dragon",
  "Fairy",
  "Fiend",
  "Fish",
  "Illusion",
  "Insect",
  "Machine",
  "Plant",
  "Psychic",
  "Pyro",
  "Reptile",
  "Rock",
  "Sea Serpent",
  "Spellcaster",
  "Thunder",
  "Warrior",
  "Winged Beast",
  "Wyrm",
  "Zombie",
];

export const SPELL_RACES = [
  "Normal",
  "Continuous",
  "Counter",
  "Equip",
  "Field",
  "Quick-Play",
  "Ritual",
];

export const TRAP_RACES = ["Normal", "Continuous", "Counter"];

// Export the API client and cache functions for advanced usage
export { apiClient, syncCardsToCache, getCacheStats, getCardFromCache };

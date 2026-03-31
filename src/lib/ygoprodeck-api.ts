import { YugiohCard, CardSearchFilters, BanListInfo } from "@/types/card";
import { 
  searchCardsAdvanced, 
  syncCardsToCache, 
  getCardFromCache, 
  getCardsFromCache, 
  getCacheStats,
  getSearchSuggestions,
  addToSearchHistory,
} from "./card-cache-service";

const API_BASE = "https://db.ygoprodeck.com/api/v7";

// Request deduplication cache
const inFlightRequests = new Map<string, Promise<unknown>>();
let isSyncing = false;

class YGOProDeckAPIClient {
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;
  private readonly RATE_LIMIT_DELAY = 50;
  private lastRequestTime = 0;

  private async makeRequest(
    url: string,
    retries = this.MAX_RETRIES,
    signal?: AbortSignal
  ): Promise<unknown> {
    if (signal?.aborted) {
      throw new Error('Request aborted');
    }

    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.RATE_LIMIT_DELAY - timeSinceLastRequest)
      );
    }
    this.lastRequestTime = Date.now();

    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await fetch(url, { signal });

      if (!response.ok) {
        if (response.status === 429 && retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, this.RETRY_DELAY * 2));
          return this.makeRequest(url, retries - 1, signal);
        }

        if (response.status >= 500 && retries > 0) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.RETRY_DELAY * (this.MAX_RETRIES - retries + 1))
          );
          return this.makeRequest(url, retries - 1, signal);
        }

        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.cache.set(url, { data, timestamp: Date.now() });

      return data;
    } catch (error) {
      if (signal?.aborted) {
        throw new Error('Request aborted');
      }
      if (retries > 0 && (error as Error).message.includes("fetch")) {
        await new Promise((resolve) => setTimeout(resolve, this.RETRY_DELAY));
        return this.makeRequest(url, retries - 1, signal);
      }
      throw error;
    }
  }

  async get(endpoint: string, signal?: AbortSignal): Promise<unknown> {
    const url = `${API_BASE}${endpoint}`;
    const existingRequest = inFlightRequests.get(url);
    if (existingRequest) {
      return existingRequest;
    }

    const request = this.makeRequest(url, this.MAX_RETRIES, signal);
    inFlightRequests.set(url, request);

    try {
      return await request;
    } finally {
      inFlightRequests.delete(url);
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

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

export interface SearchResult {
  cards: YugiohCard[];
  totalCount: number;
  hasMore: boolean;
  source: 'cache' | 'api';
  suggestions?: string[];
}

async function isCacheReady(): Promise<boolean> {
  const stats = await getCacheStats();
  return stats.cardCount > 0;
}

export async function searchCards(
  filters: CardSearchFilters,
  page: number = 1,
  pageSize: number = 50,
  signal?: AbortSignal
): Promise<SearchResult> {
  const offset = (page - 1) * pageSize;

  // Try cache first with advanced search
  const cacheResult = await searchCardsAdvanced(filters, {
    limit: pageSize,
    offset,
    fuzzy: true,
    includeSuggestions: true,
  });

  // If we have cache results, add to history and return
  if (cacheResult.cards.length > 0 || await isCacheReady()) {
    if (filters.name) {
      addToSearchHistory(filters.name);
    }
    return cacheResult;
  }

  // Fallback to API if cache is not ready
  try {
    const apiResults = await searchCardsFromAPI(filters, page, pageSize, signal);
    
    if (!isSyncing && !await isCacheReady()) {
      isSyncing = true;
      syncCardsToCache().finally(() => { isSyncing = false; });
    }

    if (filters.name) {
      addToSearchHistory(filters.name);
    }

    return { ...apiResults, source: 'api' };
  } catch (error) {
    if ((error as Error).message === 'Request aborted') {
      throw error;
    }
    console.error("API search error:", error);
    return { cards: [], totalCount: 0, hasMore: false, source: 'api' };
  }
}

async function searchCardsFromAPI(
  filters: CardSearchFilters,
  page: number,
  pageSize: number,
  signal?: AbortSignal
): Promise<Omit<SearchResult, 'source'>> {
  const keyword = filters.name?.trim();

  if (keyword && keyword.length >= 2) {
    try {
      const [nameResults, descResults] = await Promise.all([
        searchByParams({ ...filters, searchType: "name" }, page, pageSize, signal)
          .catch(() => ({ cards: [] as YugiohCard[], totalCount: 0, hasMore: false })),
        searchByParams({ ...filters, searchType: "desc", num: pageSize }, page, pageSize, signal)
          .catch(() => ({ cards: [] as YugiohCard[], totalCount: 0, hasMore: false })),
      ]);

      const seen = new Set<number>();
      const merged: YugiohCard[] = [];

      for (const card of nameResults.cards) {
        if (!seen.has(card.id)) {
          seen.add(card.id);
          merged.push(card);
        }
      }
      
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
      if ((error as Error).message === 'Request aborted') throw error;
      console.error("Search error:", error);
      return { cards: [], totalCount: 0, hasMore: false };
    }
  }

  return searchByParams(filters, page, pageSize, signal);
}

function searchByParams(
  filters: CardSearchFilters & { searchType?: "name" | "desc"; num?: number },
  page: number,
  pageSize: number,
  signal?: AbortSignal
): Promise<{ cards: YugiohCard[]; totalCount: number; hasMore: boolean }> {
  const params = new URLSearchParams();

  if (filters.name && filters.name.trim()) {
    const searchTerm = filters.name.trim();
    if (filters.searchType === "desc") {
      params.set("desc", searchTerm);
    } else {
      params.set("fname", searchTerm);
    }
  }

  if (filters.type) params.set("type", filters.type);
  if (filters.attribute) params.set("attribute", filters.attribute);
  if (filters.race) params.set("race", filters.race);
  if (filters.level !== undefined) params.set("level", String(filters.level));
  if (filters.atkMin !== undefined) params.set("atk", String(filters.atkMin));
  if (filters.defMin !== undefined) params.set("def", String(filters.defMin));
  if (filters.archetype) params.set("archetype", filters.archetype);

  const num = filters.num || pageSize;
  const offset = (page - 1) * pageSize;
  params.set("num", String(num));
  params.set("offset", String(offset));

  const url = `/cardinfo.php?${params.toString()}`;
  
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
      return { cards, totalCount: totalRows, hasMore: offset + cards.length < totalRows };
    })
    .finally(() => { inFlightRequests.delete(url); });
}

export async function getCardById(id: number): Promise<YugiohCard | null> {
  const cached = await getCardFromCache(id);
  if (cached) return cached;

  try {
    const data = (await apiClient.get(`/cardinfo.php?id=${id}`)) as CardInfoResponse;
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

export async function getCardsByIds(ids: number[]): Promise<GetCardsByIdsResult> {
  if (ids.length === 0) return { cards: [], notFoundIds: [] };

  const cachedCards = await getCardsFromCache(ids);
  const foundIds = new Set(cachedCards.map((c) => c.id));
  const missingIds = ids.filter((id) => !foundIds.has(id));

  if (missingIds.length === 0) {
    return { cards: cachedCards, notFoundIds: [] };
  }

  const batchSize = 50;
  const results: YugiohCard[] = [...cachedCards];

  for (let i = 0; i < missingIds.length; i += batchSize) {
    const batch = missingIds.slice(i, i + batchSize);
    const idsParam = batch.join(",");

    try {
      const data = (await apiClient.get(`/cardinfo.php?id=${idsParam}`)) as CardInfoResponse;
      if (data.data) results.push(...data.data);
    } catch (error) {
      console.error("Error fetching cards batch:", error);
    }
  }

  const finalFoundIds = new Set(results.map((c) => c.id));
  const notFoundIds = ids.filter((id) => !finalFoundIds.has(id));

  return { cards: results, notFoundIds };
}

export async function getBanList(): Promise<BanListInfo[]> {
  try {
    const [tcgData, ocgData] = await Promise.all([
      apiClient.get("/cardinfo.php?banlist=tcg") as Promise<BanListResponse>,
      apiClient.get("/cardinfo.php?banlist=ocg") as Promise<BanListResponse>,
    ]);

    const banListMap = new Map<number, BanListInfo>();

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

function normalizeBanStatus(status: string): "Forbidden" | "Limited" | "Semi-Limited" {
  if (status === "Forbidden") return "Forbidden";
  return status as "Forbidden" | "Limited" | "Semi-Limited";
}

interface ArchetypeResponse {
  archetype_name: string;
}

export async function getAllArchetypes(): Promise<string[]> {
  try {
    const data = (await apiClient.get("/archetypes.php")) as ArchetypeResponse[];
    return data.map((a) => a.archetype_name);
  } catch (error) {
    console.error("Error fetching archetypes:", error);
    return [];
  }
}

// Re-export for convenience
export { 
  getSearchSuggestions, 
  addToSearchHistory, 
  getCacheStats, 
  syncCardsToCache,
  getCardFromCache,
};

export const CARD_TYPES = [
  "Effect Monster", "Flip Effect Monster", "Fusion Monster", "Link Monster",
  "Normal Monster", "Pendulum Effect Monster", "Pendulum Flip Effect Monster",
  "Pendulum Normal Monster", "Pendulum Tuner Effect Monster", "Ritual Effect Monster",
  "Ritual Monster", "Spell Card", "Spirit Monster", "Synchro Monster",
  "Synchro Pendulum Effect Monster", "Synchro Tuner Monster", "Trap Card",
  "Tuner Monster", "Union Effect Monster", "XYZ Monster", "XYZ Pendulum Effect Monster",
];

export const CARD_ATTRIBUTES = [
  "DARK", "DIVINE", "EARTH", "FIRE", "LIGHT", "WATER", "WIND",
];

export const MONSTER_RACES = [
  "Aqua", "Beast", "Beast-Warrior", "Cyberse", "Dinosaur", "Divine-Beast",
  "Dragon", "Fairy", "Fiend", "Fish", "Illusion", "Insect", "Machine", "Plant",
  "Psychic", "Pyro", "Reptile", "Rock", "Sea Serpent", "Spellcaster", "Thunder",
  "Warrior", "Winged Beast", "Wyrm", "Zombie",
];

export const SPELL_RACES = [
  "Normal", "Continuous", "Counter", "Equip", "Field", "Quick-Play", "Ritual",
];

export const TRAP_RACES = ["Normal", "Continuous", "Counter"];

export { apiClient };

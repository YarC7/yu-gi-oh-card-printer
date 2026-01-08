import { YugiohCard, CardSearchFilters, BanListInfo } from "@/types/card";

const API_BASE = "https://db.ygoprodeck.com/api/v7";

// API Client with caching, retry, and rate limiting
class YGOProDeckAPIClient {
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second
  private readonly RATE_LIMIT_DELAY = 100; // 100ms between requests
  private lastRequestTime = 0;

  private async makeRequest(
    url: string,
    retries = this.MAX_RETRIES
  ): Promise<unknown> {
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
    const cacheKey = url;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited, wait longer and retry
          if (retries > 0) {
            await new Promise((resolve) =>
              setTimeout(resolve, this.RETRY_DELAY * 2)
            );
            return this.makeRequest(url, retries - 1);
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
          return this.makeRequest(url, retries - 1);
        }

        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Cache the result
      this.cache.set(cacheKey, { data, timestamp: Date.now() });

      return data;
    } catch (error) {
      if (retries > 0 && (error as Error).message.includes("fetch")) {
        // Network error, retry
        await new Promise((resolve) => setTimeout(resolve, this.RETRY_DELAY));
        return this.makeRequest(url, retries - 1);
      }
      throw error;
    }
  }

  async get(endpoint: string): Promise<unknown> {
    const url = `${API_BASE}${endpoint}`;
    return this.makeRequest(url);
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

export async function searchCards(
  filters: CardSearchFilters,
  page: number = 1,
  pageSize: number = 50
): Promise<{ cards: YugiohCard[]; totalCount: number; hasMore: boolean }> {
  const keyword = filters.name?.trim();

  // If we have a keyword, search both by name and description separately then merge
  if (keyword && keyword.length >= 2) {
    try {
      // Try name search first (usually faster and more relevant)
      const nameResults = await searchByParams(
        {
          ...filters,
          searchType: "name",
        },
        page,
        pageSize
      );

      // If we have enough results from name search, return them
      if (nameResults.cards.length >= pageSize) {
        return nameResults;
      }

      // Otherwise, also search description but limit to avoid too many results
      const descResults = await searchByParams(
        {
          ...filters,
          searchType: "desc",
          num: Math.max(1, pageSize - nameResults.cards.length), // Limit desc search to fill remaining slots
        },
        page,
        pageSize
      );

      // Merge and deduplicate results
      const seen = new Set<number>();
      const merged: YugiohCard[] = [];

      for (const card of [...nameResults.cards, ...descResults.cards]) {
        if (!seen.has(card.id)) {
          seen.add(card.id);
          merged.push(card);
        }
      }

      return {
        cards: merged.slice(0, pageSize),
        totalCount: Math.max(nameResults.totalCount, descResults.totalCount),
        hasMore: nameResults.hasMore || descResults.hasMore,
      };
    } catch (error) {
      // If parallel search fails, fall back to single search
      console.warn(
        "Parallel search failed, falling back to name search:",
        error
      );
      return searchByParams({ ...filters, searchType: "name" }, page, pageSize);
    }
  }

  // No keyword, just search with other filters
  return searchByParams(filters, page, pageSize);
}

async function searchByParams(
  filters: CardSearchFilters & { searchType?: "name" | "desc"; num?: number },
  page: number = 1,
  pageSize: number = 50
): Promise<{ cards: YugiohCard[]; totalCount: number; hasMore: boolean }> {
  const params = new URLSearchParams();

  if (filters.name) {
    if (filters.searchType === "desc") {
      params.append("desc", filters.name);
    } else {
      params.append("fname", filters.name);
    }
  }

  if (filters.type) params.append("type", filters.type);
  if (filters.attribute) params.append("attribute", filters.attribute);
  if (filters.race) params.append("race", filters.race);
  if (filters.level) params.append("level", filters.level.toString());
  if (filters.archetype) params.append("archetype", filters.archetype);

  if (filters.atkMin !== undefined) {
    params.append("atk", `gte${filters.atkMin}`);
  }

  if (filters.defMin !== undefined) {
    params.append("def", `gte${filters.defMin}`);
  }

  const effectivePageSize = filters.num || pageSize;
  const offset = (page - 1) * effectivePageSize;

  params.append("num", effectivePageSize.toString());
  params.append("offset", offset.toString());

  try {
    const data = (await apiClient.get(
      `/cardinfo.php?${params.toString()}`
    )) as CardInfoResponse;
    const cards = data.data || [];
    const totalCount = data.meta?.total_rows || cards.length;
    const hasMore = offset + cards.length < totalCount;

    return {
      cards,
      totalCount,
      hasMore,
    };
  } catch (error) {
    console.error("Error searching cards:", error);
    return {
      cards: [],
      totalCount: 0,
      hasMore: false,
    };
  }
}

export async function getCardById(id: number): Promise<YugiohCard | null> {
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

  const uniqueIds = [...new Set(ids)];
  const batchSize = 50;
  const results: YugiohCard[] = [];

  for (let i = 0; i < uniqueIds.length; i += batchSize) {
    const batch = uniqueIds.slice(i, i + batchSize);
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

  // Find IDs that weren't found in the API
  const foundIds = new Set(results.map((c) => c.id));
  const notFoundIds = uniqueIds.filter((id) => !foundIds.has(id));

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
          ban_ocg: undefined, // Will be filled from OCG data
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

// Export the API client for advanced usage
export { apiClient };

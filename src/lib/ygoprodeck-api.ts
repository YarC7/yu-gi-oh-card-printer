import { YugiohCard, CardSearchFilters, BanListInfo } from "@/types/card";

const API_BASE = "https://db.ygoprodeck.com/api/v7";

export async function searchCards(
  filters: CardSearchFilters
): Promise<YugiohCard[]> {
  const keyword = filters.name?.trim();

  // If we have a keyword, search both by name and description separately then merge
  if (keyword && keyword.length >= 2) {
    const [nameResults, descResults] = await Promise.all([
      searchByParams({ ...filters, searchType: "name" }),
      searchByParams({ ...filters, searchType: "desc" }),
    ]);

    // Merge and deduplicate results
    const seen = new Set<number>();
    const merged: YugiohCard[] = [];

    for (const card of [...nameResults, ...descResults]) {
      if (!seen.has(card.id)) {
        seen.add(card.id);
        merged.push(card);
      }
    }

    return merged.slice(0, 100); // Limit to 100 results
  }

  // No keyword, just search with other filters
  return searchByParams(filters);
}

async function searchByParams(
  filters: CardSearchFilters & { searchType?: "name" | "desc" }
): Promise<YugiohCard[]> {
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

  params.append("num", "50");
  params.append("offset", "0");

  try {
    const response = await fetch(
      `${API_BASE}/cardinfo.php?${params.toString()}`
    );
    if (!response.ok) {
      if (response.status === 400) {
        return [];
      }
      return [];
    }
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error searching cards:", error);
    return [];
  }
}

export async function getCardById(id: number): Promise<YugiohCard | null> {
  try {
    const response = await fetch(`${API_BASE}/cardinfo.php?id=${id}`);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
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
      const response = await fetch(`${API_BASE}/cardinfo.php?id=${idsParam}`);
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          results.push(...data.data);
        }
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
    const response = await fetch(`${API_BASE}/cardinfo.php?banlist=tcg`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Transform the API response to our BanListInfo format
    const banList: BanListInfo[] = [];

    data.data.forEach((card: any) => {
      if (card.banlist_info) {
        banList.push({
          cardId: card.id,
          ban_tcg: card.banlist_info.ban_tcg,
          ban_ocg: card.banlist_info.ban_ocg,
          ban_goat: card.banlist_info.ban_goat,
        });
      }
    });

    return banList;
  } catch (error) {
    console.error("Error fetching ban list:", error);
    return [];
  }
}

export async function getAllArchetypes(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE}/archetypes.php`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.map((a: { archetype_name: string }) => a.archetype_name);
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

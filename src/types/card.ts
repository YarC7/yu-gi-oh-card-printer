export interface YugiohCard {
  id: number;
  name: string;
  type: string;
  frameType: string;
  desc: string;
  atk?: number;
  def?: number;
  level?: number;
  race: string;
  attribute?: string;
  archetype?: string;
  linkval?: number;
  linkmarkers?: string[];
  scale?: number;
  card_sets?: CardSet[];
  card_images: CardImage[];
  card_prices?: CardPrice[];
}

export interface CardImage {
  id: number;
  image_url: string;
  image_url_small: string;
  image_url_cropped: string;
}

export interface CardSet {
  set_name: string;
  set_code: string;
  set_rarity: string;
  set_rarity_code: string;
  set_price: string;
}

export interface CardPrice {
  cardmarket_price: string;
  tcgplayer_price: string;
  ebay_price: string;
  amazon_price: string;
  coolstuffinc_price: string;
}

export interface BanListInfo {
  cardId: number;
  ban_tcg?: 'Banned' | 'Limited' | 'Semi-Limited';
  ban_ocg?: 'Banned' | 'Limited' | 'Semi-Limited';
  ban_goat?: 'Banned' | 'Limited' | 'Semi-Limited';
}



export interface DeckCard {
  card: YugiohCard;
  quantity: number;
  section: 'main' | 'extra' | 'side';
}

export interface Deck {
  id?: string;
  name: string;
  description?: string;
  cards: DeckCard[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CardSearchFilters {
  name?: string;
  type?: string;
  attribute?: string;
  race?: string;
  level?: number;
  atkMin?: number;
  atkMax?: number;
  defMin?: number;
  defMax?: number;
  archetype?: string;
}

export interface ExportSettings {
  cardWidth: number; // in cm
  cardHeight: number; // in cm
  pageWidth: number; // in cm (A4 = 21)
  pageHeight: number; // in cm (A4 = 29.7)
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  gap: number;
  format: 'docx' | 'pdf';
}

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  cardWidth: 5.9,
  cardHeight: 8.6,
  pageWidth: 21,
  pageHeight: 29.7,
  marginTop: 1,
  marginRight: 1,
  marginBottom: 1,
  marginLeft: 1,
  gap: 0.2,
  format: 'pdf',
};

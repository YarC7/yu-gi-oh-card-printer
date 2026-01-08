import { supabase } from '@/integrations/supabase/client';
import { YugiohCard } from '@/types/card';

export interface CustomCardInput {
  name: string;
  type: string;
  description?: string;
  attribute?: string;
  race?: string;
  level?: number;
  atk?: number;
  def?: number;
  linkVal?: number;
  scale?: number;
  archetype?: string;
  imageFile?: File;
}

export interface CustomCardRow {
  id: string;
  user_id: string;
  name: string;
  type: string;
  frame_type: string;
  description: string | null;
  attribute: string | null;
  race: string | null;
  level: number | null;
  atk: number | null;
  def: number | null;
  link_val: number | null;
  scale: number | null;
  archetype: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

function getFrameType(type: string): string {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('spell')) return 'spell';
  if (lowerType.includes('trap')) return 'trap';
  if (lowerType.includes('fusion')) return 'fusion';
  if (lowerType.includes('synchro')) return 'synchro';
  if (lowerType.includes('xyz')) return 'xyz';
  if (lowerType.includes('link')) return 'link';
  if (lowerType.includes('ritual')) return 'ritual';
  if (lowerType.includes('pendulum')) return 'effect_pendulum';
  if (lowerType.includes('normal')) return 'normal';
  return 'effect';
}

export function customCardToYugiohCard(row: CustomCardRow): YugiohCard {
  return {
    id: -Math.abs(row.id.charCodeAt(0) * 1000000 + row.id.charCodeAt(1) * 10000 + Date.now() % 10000),
    name: row.name,
    type: row.type,
    frameType: row.frame_type,
    desc: row.description || '',
    race: row.race || 'Unknown',
    attribute: row.attribute || undefined,
    atk: row.atk || undefined,
    def: row.def || undefined,
    level: row.level || undefined,
    linkval: row.link_val || undefined,
    scale: row.scale || undefined,
    archetype: row.archetype || undefined,
    card_images: row.image_url ? [{
      id: -Date.now(),
      image_url: row.image_url,
      image_url_small: row.image_url,
      image_url_cropped: row.image_url,
    }] : [],
  };
}

export async function uploadCustomCardImage(userId: string, file: File): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { error } = await supabase.storage
    .from('custom-cards')
    .upload(fileName, file, { upsert: true });

  if (error) {
    console.error('Error uploading image:', error);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('custom-cards')
    .getPublicUrl(fileName);

  return publicUrl;
}

export async function createCustomCard(
  userId: string,
  input: CustomCardInput
): Promise<CustomCardRow | null> {
  let imageUrl: string | null = null;

  if (input.imageFile) {
    imageUrl = await uploadCustomCardImage(userId, input.imageFile);
  }

  const { data, error } = await supabase
    .from('custom_cards')
    .insert({
      user_id: userId,
      name: input.name,
      type: input.type,
      frame_type: getFrameType(input.type),
      description: input.description || null,
      attribute: input.attribute || null,
      race: input.race || null,
      level: input.level || null,
      atk: input.atk || null,
      def: input.def || null,
      link_val: input.linkVal || null,
      scale: input.scale || null,
      archetype: input.archetype || null,
      image_url: imageUrl,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating custom card:', error);
    return null;
  }

  return data;
}

export async function searchCustomCards(keyword?: string): Promise<YugiohCard[]> {
  let query = supabase.from('custom_cards').select('*');

  if (keyword && keyword.trim().length >= 2) {
    query = query.or(`name.ilike.%${keyword.trim()}%,description.ilike.%${keyword.trim()}%`);
  }

  const { data, error } = await query.limit(50);

  if (error) {
    console.error('Error searching custom cards:', error);
    return [];
  }

  return (data || []).map(customCardToYugiohCard);
}

export async function getAllCustomCards(): Promise<YugiohCard[]> {
  const { data, error } = await supabase
    .from('custom_cards')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching custom cards:', error);
    return [];
  }

  return (data || []).map(customCardToYugiohCard);
}

export async function deleteCustomCard(cardId: string): Promise<boolean> {
  const { error } = await supabase
    .from('custom_cards')
    .delete()
    .eq('id', cardId);

  return !error;
}

import { supabase } from '@/integrations/supabase/client';
import { Deck, DeckCard } from '@/types/card';
import { Json } from '@/integrations/supabase/types';

export interface SavedDeckRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  cards: DeckCard[];
  created_at: string;
  updated_at: string;
}

export async function saveDeck(deck: Deck, userId: string): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('saved_decks')
    .insert({
      user_id: userId,
      name: deck.name,
      description: deck.description || null,
      cards: deck.cards as unknown as Json,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error saving deck:', error);
    return null;
  }

  return data;
}

export async function updateDeck(deckId: string, deck: Partial<Deck>): Promise<boolean> {
  const updateData: { name?: string; description?: string | null; cards?: Json } = {};
  if (deck.name) updateData.name = deck.name;
  if (deck.description !== undefined) updateData.description = deck.description;
  if (deck.cards) updateData.cards = deck.cards as unknown as Json;

  const { error } = await supabase
    .from('saved_decks')
    .update(updateData)
    .eq('id', deckId);

  if (error) {
    console.error('Error updating deck:', error);
    return false;
  }

  return true;
}

export async function deleteDeck(deckId: string): Promise<boolean> {
  const { error } = await supabase
    .from('saved_decks')
    .delete()
    .eq('id', deckId);

  if (error) {
    console.error('Error deleting deck:', error);
    return false;
  }

  return true;
}

export async function getUserDecks(userId: string): Promise<SavedDeckRow[]> {
  const { data, error } = await supabase
    .from('saved_decks')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching decks:', error);
    return [];
  }

  return (data || []).map(row => ({
    ...row,
    cards: (row.cards || []) as unknown as DeckCard[],
  }));
}

export async function getDeckById(deckId: string): Promise<SavedDeckRow | null> {
  const { data, error } = await supabase
    .from('saved_decks')
    .select('*')
    .eq('id', deckId)
    .single();

  if (error) {
    console.error('Error fetching deck:', error);
    return null;
  }

  return {
    ...data,
    cards: (data.cards || []) as unknown as DeckCard[],
  };
}

export async function saveGenerationHistory(
  userId: string,
  deckName: string,
  cardCount: number,
  exportFormat: string,
  deckId?: string
): Promise<boolean> {
  const { error } = await supabase
    .from('generation_history')
    .insert({
      user_id: userId,
      deck_id: deckId || null,
      deck_name: deckName,
      card_count: cardCount,
      export_format: exportFormat,
    });

  if (error) {
    console.error('Error saving history:', error);
    return false;
  }

  return true;
}

export async function getGenerationHistory(userId: string) {
  const { data, error } = await supabase
    .from('generation_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching history:', error);
    return [];
  }

  return data || [];
}

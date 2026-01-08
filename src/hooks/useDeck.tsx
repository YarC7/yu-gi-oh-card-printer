import { useState, useCallback } from 'react';
import { DeckCard, YugiohCard, Deck } from '@/types/card';

export function useDeck() {
  const [deck, setDeck] = useState<Deck>({
    name: 'Untitled Deck',
    cards: [],
  });

  const addCard = useCallback((card: YugiohCard, section: 'main' | 'extra' | 'side' = 'main') => {
    setDeck((prev) => {
      const existingIndex = prev.cards.findIndex(
        (c) => c.card.id === card.id && c.section === section
      );

      if (existingIndex >= 0) {
        // Increment quantity (max 3)
        const newCards = [...prev.cards];
        if (newCards[existingIndex].quantity < 3) {
          newCards[existingIndex] = {
            ...newCards[existingIndex],
            quantity: newCards[existingIndex].quantity + 1,
          };
        }
        return { ...prev, cards: newCards };
      } else {
        // Add new card
        return {
          ...prev,
          cards: [...prev.cards, { card, quantity: 1, section }],
        };
      }
    });
  }, []);

  const removeCard = useCallback((cardId: number, section: 'main' | 'extra' | 'side') => {
    setDeck((prev) => {
      const existingIndex = prev.cards.findIndex(
        (c) => c.card.id === cardId && c.section === section
      );

      if (existingIndex >= 0) {
        const newCards = [...prev.cards];
        if (newCards[existingIndex].quantity > 1) {
          newCards[existingIndex] = {
            ...newCards[existingIndex],
            quantity: newCards[existingIndex].quantity - 1,
          };
        } else {
          newCards.splice(existingIndex, 1);
        }
        return { ...prev, cards: newCards };
      }

      return prev;
    });
  }, []);

  const setCards = useCallback((cards: DeckCard[]) => {
    setDeck((prev) => ({ ...prev, cards }));
  }, []);

  const setDeckName = useCallback((name: string) => {
    setDeck((prev) => ({ ...prev, name }));
  }, []);

  const setDeckDescription = useCallback((description: string) => {
    setDeck((prev) => ({ ...prev, description }));
  }, []);

  const clearDeck = useCallback(() => {
    setDeck({ name: 'Untitled Deck', cards: [] });
  }, []);

  const loadDeck = useCallback((newDeck: Deck) => {
    setDeck(newDeck);
  }, []);

  const getMainDeckCards = useCallback(() => {
    return deck.cards.filter((c) => c.section === 'main');
  }, [deck.cards]);

  const getExtraDeckCards = useCallback(() => {
    return deck.cards.filter((c) => c.section === 'extra');
  }, [deck.cards]);

  const getSideDeckCards = useCallback(() => {
    return deck.cards.filter((c) => c.section === 'side');
  }, [deck.cards]);

  const getTotalCardCount = useCallback(() => {
    return deck.cards.reduce((sum, c) => sum + c.quantity, 0);
  }, [deck.cards]);

  const getAllCardsFlat = useCallback(() => {
    const result: YugiohCard[] = [];
    for (const deckCard of deck.cards) {
      for (let i = 0; i < deckCard.quantity; i++) {
        result.push(deckCard.card);
      }
    }
    return result;
  }, [deck.cards]);

  return {
    deck,
    addCard,
    removeCard,
    setCards,
    setDeckName,
    setDeckDescription,
    clearDeck,
    loadDeck,
    getMainDeckCards,
    getExtraDeckCards,
    getSideDeckCards,
    getTotalCardCount,
    getAllCardsFlat,
  };
}

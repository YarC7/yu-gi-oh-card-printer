export interface ParsedYDK {
  main: number[];
  extra: number[];
  side: number[];
}

export function parseYDKFile(content: string): ParsedYDK {
  const result: ParsedYDK = {
    main: [],
    extra: [],
    side: [],
  };

  const lines = content.split(/\r?\n/);
  let currentSection: 'main' | 'extra' | 'side' | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine === '#main') {
      currentSection = 'main';
      continue;
    }
    if (trimmedLine === '#extra') {
      currentSection = 'extra';
      continue;
    }
    if (trimmedLine === '!side') {
      currentSection = 'side';
      continue;
    }

    // Skip comments and empty lines
    if (trimmedLine.startsWith('#') || trimmedLine.startsWith('!') || trimmedLine === '') {
      continue;
    }

    // Try to parse as card ID
    const cardId = parseInt(trimmedLine, 10);
    if (!isNaN(cardId) && cardId > 0 && currentSection) {
      result[currentSection].push(cardId);
    }
  }

  return result;
}

export function parseJSONDeck(content: string): ParsedYDK {
  try {
    const data = JSON.parse(content);
    
    // Support multiple JSON formats
    if (Array.isArray(data)) {
      // Simple array of IDs
      return {
        main: data.filter((id) => typeof id === 'number'),
        extra: [],
        side: [],
      };
    }
    
    if (data.main || data.extra || data.side) {
      return {
        main: Array.isArray(data.main) ? data.main.filter((id: unknown) => typeof id === 'number') : [],
        extra: Array.isArray(data.extra) ? data.extra.filter((id: unknown) => typeof id === 'number') : [],
        side: Array.isArray(data.side) ? data.side.filter((id: unknown) => typeof id === 'number') : [],
      };
    }
    
    // YGOPRODeck format
    if (data.cards && Array.isArray(data.cards)) {
      const ids = data.cards.map((c: { id: number }) => c.id).filter((id: unknown) => typeof id === 'number');
      return {
        main: ids,
        extra: [],
        side: [],
      };
    }
    
    return { main: [], extra: [], side: [] };
  } catch (error) {
    console.error('Error parsing JSON deck:', error);
    return { main: [], extra: [], side: [] };
  }
}

export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

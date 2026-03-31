-- Full-text search index (wrap desc in quotes)
CREATE INDEX IF NOT EXISTS idx_cards_fts 
ON cached_cards 
USING gin (to_tsvector('english', name || ' ' || COALESCE("desc", '')));

-- Alternative: wrap the whole expression in a function
CREATE OR REPLACE FUNCTION card_search_vector(name TEXT, card_desc TEXT)
RETURNS tsvector AS $$
BEGIN
  RETURN to_tsvector('english', name || ' ' || COALESCE(card_desc, ''));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Then create index using the function
CREATE INDEX IF NOT EXISTS idx_cards_fts_func 
ON cached_cards 
USING gin (card_search_vector(name, "desc"));

-- Search function that returns ranked results
CREATE OR REPLACE FUNCTION search_cards_fts(search_query TEXT)
RETURNS TABLE (
    id INTEGER,
    name TEXT,
    type TEXT,
    frame_type TEXT,
    "desc" TEXT,
    atk INTEGER,
    def INTEGER,
    level INTEGER,
    race TEXT,
    attribute TEXT,
    archetype TEXT,
    linkval INTEGER,
    linkmarkers TEXT[],
    scale INTEGER,
    ygoprodeck_url TEXT,
    card_images JSONB,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.type,
        c.frame_type,
        c."desc",
        c.atk,
        c.def,
        c.level,
        c.race,
        c.attribute,
        c.archetype,
        c.linkval,
        c.linkmarkers,
        c.scale,
        c.ygoprodeck_url,
        c.card_images,
        ts_rank(
            to_tsvector('english', c.name || ' ' || COALESCE(c."desc", '')),
            plainto_tsquery('english', search_query)
        ) AS rank
    FROM cached_cards c
    WHERE to_tsvector('english', c.name || ' ' || COALESCE(c."desc", '')) 
          @@ plainto_tsquery('english', search_query)
    ORDER BY rank DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql;

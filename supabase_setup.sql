-- Enable pg_trgm extension for fuzzy search (only needs to run once)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create the cached_cards table
CREATE TABLE IF NOT EXISTS cached_cards (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    frame_type TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    atk INTEGER,
    def INTEGER,
    level INTEGER,
    race TEXT NOT NULL,
    attribute TEXT,
    archetype TEXT,
    linkval INTEGER,
    linkmarkers TEXT[],
    scale INTEGER,
    ygoprodeck_url TEXT,
    card_images JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for cache table (public data)
ALTER TABLE cached_cards DISABLE ROW LEVEL SECURITY;

-- Create indexes for faster search
-- Trigram index for fuzzy text search on name
CREATE INDEX IF NOT EXISTS idx_cached_cards_name_trgm 
    ON cached_cards USING gin (name gin_trgm_ops);

-- Regular indexes for filters
CREATE INDEX IF NOT EXISTS idx_cached_cards_name 
    ON cached_cards(name);
CREATE INDEX IF NOT EXISTS idx_cached_cards_type 
    ON cached_cards(type);
CREATE INDEX IF NOT EXISTS idx_cached_cards_attribute 
    ON cached_cards(attribute);
CREATE INDEX IF NOT EXISTS idx_cached_cards_race 
    ON cached_cards(race);
CREATE INDEX IF NOT EXISTS idx_cached_cards_level 
    ON cached_cards(level);
CREATE INDEX IF NOT EXISTS idx_cached_cards_atk 
    ON cached_cards(atk);
CREATE INDEX IF NOT EXISTS idx_cached_cards_def 
    ON cached_cards(def);
CREATE INDEX IF NOT EXISTS idx_cached_cards_archetype 
    ON cached_cards(archetype);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_cached_cards_type_attribute 
    ON cached_cards(type, attribute);

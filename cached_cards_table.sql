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

-- Enable RLS
ALTER TABLE cached_cards ENABLE ROW LEVEL SECURITY;

-- Create policy for read-only access (anyone can read)
CREATE POLICY "Allow public read access" ON cached_cards
    FOR SELECT TO PUBLIC USING (true);

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_cached_cards_name ON cached_cards USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_cached_cards_type ON cached_cards(type);
CREATE INDEX IF NOT EXISTS idx_cached_cards_attribute ON cached_cards(attribute);
CREATE INDEX IF NOT EXISTS idx_cached_cards_race ON cached_cards(race);

-- Create the full-text search RPC function for Supabase
CREATE OR REPLACE FUNCTION search_cards_tsquery(
    search_query TEXT,
    result_limit INTEGER DEFAULT 50,
    result_offset INTEGER DEFAULT 0
)
RETURNS SETOF cached_cards
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    ts_query tsquery;
BEGIN
    -- Convert search query to tsquery
    ts_query := plainto_tsquery('english', search_query);
    
    -- Return ranked results based on FTS
    RETURN QUERY
    SELECT c.*
    FROM cached_cards c
    WHERE 
        -- Check if the combined name+description matches the query
        to_tsvector('english', c.name || ' ' || COALESCE(c."desc", '')) @@ ts_query
        -- Or if name contains the term (for partial matches)
        OR c.name ILIKE '%' || search_query || '%'
    ORDER BY 
        -- Primary: FTS rank (higher is better)
        ts_rank(
            to_tsvector('english', c.name || ' ' || COALESCE(c."desc", '')),
            ts_query
        ) DESC,
        -- Secondary: name starts with query
        CASE WHEN c.name ILIKE search_query || '%' THEN 1 ELSE 0 END DESC,
        -- Tertiary: name contains query
        CASE WHEN c.name ILIKE '%' || search_query || '%' THEN 1 ELSE 0 END DESC,
        c.name ASC
    LIMIT result_limit
    OFFSET result_offset;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION search_cards_tsquery(TEXT, INTEGER, INTEGER) TO PUBLIC;

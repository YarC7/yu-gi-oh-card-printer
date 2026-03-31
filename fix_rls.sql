-- Option 1: Disable RLS completely (simplest for cache data)
ALTER TABLE cached_cards DISABLE ROW LEVEL SECURITY;

-- Option 2: If you want to keep RLS but allow operations via service_role
-- DROP POLICY IF EXISTS "Allow service role full access" ON cached_cards;
-- CREATE POLICY "Allow service role full access" ON cached_cards
--     FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Verify RLS is disabled
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'cached_cards';

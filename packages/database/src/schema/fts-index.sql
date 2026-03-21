-- FTS GIN index for search/explore discovery
-- This index is also included in the Drizzle migration (0000_*.sql)
-- Kept here as reference for the index definition
CREATE INDEX IF NOT EXISTS users_fts_idx
ON users
USING gin (to_tsvector('english', coalesce(username, '') || ' ' || coalesce(full_name, '') || ' ' || coalesce(tagline, '') || ' ' || coalesce(location, '')));

CREATE INDEX IF NOT EXISTS users_fts_idx
ON users
USING gin (to_tsvector('english', coalesce(username, '') || ' ' || coalesce(full_name, '') || ' ' || coalesce(bio, '')));

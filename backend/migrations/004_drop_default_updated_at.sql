-- Remove default timestamp from updated_at so it stays NULL on insert
ALTER TABLE users ALTER COLUMN updated_at DROP DEFAULT;
-- Optionally, clear out updated_at if it matches created_at (for users just created)
UPDATE users SET updated_at = NULL WHERE updated_at = created_at;

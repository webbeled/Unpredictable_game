-- Add consent column to users table
-- 1 = agreed, 0 = did not agree, NULL = not yet asked
ALTER TABLE users ADD COLUMN consent SMALLINT DEFAULT NULL;

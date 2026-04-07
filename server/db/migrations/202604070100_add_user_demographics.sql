-- Up Migration
ALTER TABLE users ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_language_is_english BOOLEAN;

-- Down Migration
-- ALTER TABLE users DROP COLUMN nationality;
-- ALTER TABLE users DROP COLUMN gender;
-- ALTER TABLE users DROP COLUMN first_language_is_english;

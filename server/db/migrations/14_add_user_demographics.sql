-- Up Migration
ALTER TABLE users ADD COLUMN nationality TEXT;
ALTER TABLE users ADD COLUMN gender TEXT;
ALTER TABLE users ADD COLUMN first_language_is_english BOOLEAN;

-- Down Migration
-- ALTER TABLE users DROP COLUMN nationality;
-- ALTER TABLE users DROP COLUMN gender;
-- ALTER TABLE users DROP COLUMN first_language_is_english;

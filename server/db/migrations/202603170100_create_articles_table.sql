-- Migration: Create articles table with unique IDs

CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name VARCHAR(255),
  sheet_name VARCHAR(255),
  title VARCHAR(500),
  original_text TEXT,
  annotated_text TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(file_name, sheet_name)
);

-- Index for lookups
CREATE INDEX idx_articles_title ON articles(title);

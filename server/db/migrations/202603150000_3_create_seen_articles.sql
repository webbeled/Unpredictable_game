-- Up Migration
CREATE TABLE seen_articles (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  article_id VARCHAR(255) NOT NULL,
  viewed_at  BIGINT NOT NULL,
  UNIQUE(user_id, article_id)
);

CREATE INDEX idx_seen_articles_user_id ON seen_articles(user_id);

-- Down Migration
DROP TABLE seen_articles;

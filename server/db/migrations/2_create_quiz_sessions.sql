-- Up Migration
CREATE TABLE quiz_sessions (
  quiz_id      UUID    PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score        INTEGER NOT NULL DEFAULT 0,
  guessed_words JSONB  NOT NULL DEFAULT '[]',
  ended_at     BIGINT,
  created_at   BIGINT  NOT NULL
);

-- Down Migration
DROP TABLE quiz_sessions;

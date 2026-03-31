-- Up Migration
CREATE TABLE IF NOT EXISTS guesses (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT REFERENCES quiz_sessions(id) ON DELETE SET NULL,
  quiz_id UUID,
  user_id INTEGER,
  guess_order INTEGER,
  ts BIGINT NOT NULL,
  guessed_word TEXT,
  part_of_speech TEXT,
  correct BOOLEAN,
  score_before_guess INTEGER,
  score_after_guess INTEGER
);

CREATE INDEX IF NOT EXISTS guesses_session_id_idx ON guesses(session_id);
CREATE INDEX IF NOT EXISTS guesses_user_id_idx ON guesses(user_id);
CREATE INDEX IF NOT EXISTS guesses_quiz_id_idx ON guesses(quiz_id);

-- Down Migration
DROP INDEX IF EXISTS guesses_quiz_id_idx;
DROP INDEX IF EXISTS guesses_user_id_idx;
DROP INDEX IF EXISTS guesses_session_id_idx;
DROP TABLE IF EXISTS guesses;

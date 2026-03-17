-- Migration: Create guessed_words_expanded table for long-format analysis

CREATE TABLE guessed_words_expanded (
  id BIGSERIAL PRIMARY KEY,
  quiz_session_id BIGINT NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL,
  article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER,
  word VARCHAR(255) NOT NULL,
  pos_code VARCHAR(10),
  pos_label VARCHAR(50),
  detected_pos_code VARCHAR(10),
  detected_pos_label VARCHAR(50),
  is_number SMALLINT DEFAULT 0,
  normalized_number NUMERIC(20, 2),
  guess_index INTEGER,
  created_at BIGINT,
  FOREIGN KEY (user_id, quiz_id) REFERENCES quiz_sessions(user_id, quiz_id)
);

-- Indexes for common queries
CREATE INDEX idx_guessed_words_expanded_user_id ON guessed_words_expanded(user_id);
CREATE INDEX idx_guessed_words_expanded_quiz_id ON guessed_words_expanded(quiz_id);
CREATE INDEX idx_guessed_words_expanded_article_id ON guessed_words_expanded(article_id);
CREATE INDEX idx_guessed_words_expanded_is_number ON guessed_words_expanded(is_number);
CREATE INDEX idx_guessed_words_expanded_pos_label ON guessed_words_expanded(pos_label);
CREATE INDEX idx_guessed_words_expanded_detected_pos ON guessed_words_expanded(detected_pos_label);

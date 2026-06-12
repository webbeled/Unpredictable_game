-- Up Migration
CREATE TABLE feedback (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER,
  participant_code TEXT,
  feedback_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Down Migration
DROP TABLE feedback;

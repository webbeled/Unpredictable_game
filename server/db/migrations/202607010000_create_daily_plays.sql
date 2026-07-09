-- Up Migration
CREATE TABLE IF NOT EXISTS daily_plays (
  user_id INTEGER NOT NULL,
  day_epoch INTEGER NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  played_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, day_epoch)
);

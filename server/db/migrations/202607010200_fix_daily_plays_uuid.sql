-- Up Migration: recreate daily_plays with TEXT uuid column
DROP TABLE IF EXISTS daily_plays;

CREATE TABLE IF NOT EXISTS daily_plays (
  user_uuid TEXT NOT NULL,
  day_epoch INTEGER NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  played_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_uuid, day_epoch)
);

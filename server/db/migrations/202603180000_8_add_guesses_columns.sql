-- Add columns for storing all guesses per POS

ALTER TABLE quiz_sessions
ADD COLUMN IF NOT EXISTS adj_guesses TEXT,
ADD COLUMN IF NOT EXISTS func_guesses TEXT,
ADD COLUMN IF NOT EXISTS noun_guesses TEXT,
ADD COLUMN IF NOT EXISTS num_guesses TEXT,
ADD COLUMN IF NOT EXISTS propn_guesses TEXT,
ADD COLUMN IF NOT EXISTS verb_guesses TEXT;

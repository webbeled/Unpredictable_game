ALTER TABLE quiz_sessions
  ADD COLUMN IF NOT EXISTS adj_correct INTEGER,
  ADD COLUMN IF NOT EXISTS adj_score_before_guess INTEGER,
  ADD COLUMN IF NOT EXISTS func_correct INTEGER,
  ADD COLUMN IF NOT EXISTS func_score_before_guess INTEGER,
  ADD COLUMN IF NOT EXISTS noun_correct INTEGER,
  ADD COLUMN IF NOT EXISTS noun_score_before_guess INTEGER,
  ADD COLUMN IF NOT EXISTS num_correct INTEGER,
  ADD COLUMN IF NOT EXISTS num_score_before_guess INTEGER,
  ADD COLUMN IF NOT EXISTS propn_correct INTEGER,
  ADD COLUMN IF NOT EXISTS propn_score_before_guess INTEGER,
  ADD COLUMN IF NOT EXISTS verb_correct INTEGER,
  ADD COLUMN IF NOT EXISTS verb_score_before_guess INTEGER;

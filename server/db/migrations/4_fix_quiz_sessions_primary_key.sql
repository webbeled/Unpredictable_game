-- Up Migration
ALTER TABLE quiz_sessions
ADD COLUMN id BIGSERIAL;

ALTER TABLE quiz_sessions
DROP CONSTRAINT quiz_sessions_pkey;

ALTER TABLE quiz_sessions
ADD CONSTRAINT quiz_sessions_pkey PRIMARY KEY (id);

CREATE INDEX quiz_sessions_user_id_created_at_idx
ON quiz_sessions (user_id, created_at);

CREATE INDEX quiz_sessions_quiz_id_idx
ON quiz_sessions (quiz_id);

-- Down Migration
DROP INDEX IF EXISTS quiz_sessions_quiz_id_idx;
DROP INDEX IF EXISTS quiz_sessions_user_id_created_at_idx;

ALTER TABLE quiz_sessions
DROP CONSTRAINT quiz_sessions_pkey;

ALTER TABLE quiz_sessions
DROP COLUMN id;

ALTER TABLE quiz_sessions
ADD CONSTRAINT quiz_sessions_pkey PRIMARY KEY (quiz_id);

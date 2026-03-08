-- Up Migration
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX users_email_idx ON users USING btree (email);

-- Down Migration
DROP INDEX users_email_idx;
DROP TABLE users;

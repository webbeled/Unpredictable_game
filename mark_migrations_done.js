#!/usr/bin/env node
import { config } from 'dotenv';
import pkg from 'pg';
const { Client } = pkg;

config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

const migrations = [
  { name: '202603080000_create_users', run_on: new Date('2026-03-08').toISOString() },
  { name: '202603140000_create_quiz_sessions', run_on: new Date('2026-03-14').toISOString() },
  { name: '202603150000_create_seen_articles', run_on: new Date('2026-03-15').toISOString() },
  { name: '202603170000_fix_quiz_sessions_primary_key', run_on: new Date('2026-03-17').toISOString() },
  { name: '202603170100_create_articles_table', run_on: new Date('2026-03-17').toISOString() },
  { name: '202603170200_create_guessed_words_expanded', run_on: new Date('2026-03-17').toISOString() },
  { name: '202603170300_placeholder', run_on: new Date('2026-03-17').toISOString() },
  { name: '202603180000_add_guesses_columns', run_on: new Date('2026-03-18').toISOString() },
  { name: '202603180100_placeholder', run_on: new Date('2026-03-18').toISOString() },
  { name: '202603240000_add_pos_tracking_columns', run_on: new Date('2026-03-24').toISOString() },
  { name: '202603310000_create_guesses', run_on: new Date('2026-03-31').toISOString() },
  { name: '202603310100_add_participant_code', run_on: new Date('2026-03-31').toISOString() },
  { name: '202604070000_add_user_email_to_guesses', run_on: new Date('2026-04-07').toISOString() },
  { name: '202604070100_add_user_demographics', run_on: new Date('2026-04-07').toISOString() },
];

async function main() {
  try {
    await client.connect();
    
    // Clear old migration records
    await client.query('DELETE FROM pgmigrations');
    console.log('Cleared old migration records');
    
    // Insert new migration records
    for (const mig of migrations) {
      await client.query(
        'INSERT INTO pgmigrations (name, run_on) VALUES ($1, $2)',
        [mig.name, mig.run_on]
      );
    }
    console.log(`Marked ${migrations.length} migrations as completed`);
    
    await client.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();

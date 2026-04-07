#!/usr/bin/env node
import { config } from 'dotenv';
import pkg from 'pg';
const { Client } = pkg;

config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  try {
    await client.connect();
    
    console.log('=== RECENT QUIZ SESSIONS ===\n');
    const sessions = await client.query(`
      SELECT id, quiz_id, score, created_at, ended_at
      FROM quiz_sessions
      ORDER BY created_at DESC
      LIMIT 5
    `);
    console.log(sessions.rows);
    
    console.log('\n=== GUESSES FOR MOST RECENT SESSION ===\n');
    if (sessions.rows.length > 0) {
      const mostRecentId = sessions.rows[0].id;
      const guesses = await client.query(`
        SELECT id, session_id, guess_order, guessed_word, part_of_speech, correct, ts
        FROM guesses
        WHERE session_id = $1
        ORDER BY guess_order ASC
      `, [mostRecentId]);
      console.log(`Session ID ${mostRecentId} has ${guesses.rows.length} guesses:`);
      console.log(guesses.rows);
      
      console.log('\n=== CORRECT GUESSES AGGREGATION ===\n');
      const correctGuesses = await client.query(`
        SELECT 
          json_agg(json_build_object('part_of_speech', part_of_speech) ORDER BY guess_order) 
            FILTER (WHERE correct = true) as correct_guesses
        FROM guesses
        WHERE session_id = $1
      `, [mostRecentId]);
      console.log(correctGuesses.rows[0]);
    }
    
    await client.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();

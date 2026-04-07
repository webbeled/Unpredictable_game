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
    
    console.log('=== ALL QUIZ SESSIONS (Newest First) ===\n');
    const sessions = await client.query(`
      SELECT id, quiz_id, score, created_at, ended_at
      FROM quiz_sessions
      ORDER BY created_at DESC
      LIMIT 20
    `);
    
    sessions.rows.forEach(session => {
      console.log(`Session ${session.id}: Score=${session.score}, Created=${new Date(Number(session.created_at)).toLocaleString()}`);
    });
    
    console.log('\n=== GUESSES FOR EACH SESSION (Last 20 Sessions) ===\n');
    for (const session of sessions.rows) {
      const guesses = await client.query(`
        SELECT id, guessed_word, part_of_speech, correct, guess_order
        FROM guesses
        WHERE session_id = $1
        ORDER BY guess_order ASC
        LIMIT 5
      `, [session.id]);
      
      if (guesses.rows.length > 0) {
        console.log(`Session ${session.id} has ${guesses.rowCount} guesses:`);
        guesses.rows.forEach(g => {
          console.log(`  - "${g.guessed_word}" (POS: ${g.part_of_speech}, Correct: ${g.correct})`);
        });
      } else {
        console.log(`Session ${session.id}: NO GUESSES`);
      }
    }
    
    await client.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();

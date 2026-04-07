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
    
    console.log('=== SESSIONS WITH NO GUESSES ===\n');
    const noGuesses = await client.query(`
      SELECT qs.id, qs.quiz_id, qs.created_at, 
             COUNT(g.id) as guess_count
      FROM quiz_sessions qs
      LEFT JOIN guesses g ON qs.id = g.session_id
      GROUP BY qs.id, qs.quiz_id, qs.created_at
      HAVING COUNT(g.id) = 0
      ORDER BY qs.created_at DESC
      LIMIT 5
    `);
    
    console.log(`Found ${noGuesses.rowCount} sessions with no guesses\n`);
    
    // For each session with no guesses, check if there are orphaned guesses
    for (const session of noGuesses.rows.slice(0, 2)) {
      console.log(`\nSession ${session.id} (created_at: ${session.created_at}):`);
      
      const orphaned = await client.query(`
        SELECT id, quiz_id, ts, session_id
        FROM guesses
        WHERE quiz_id = $1 AND session_id IS NULL
        ORDER BY ts DESC
        LIMIT 5
      `, [session.quiz_id]);
      
      if (orphaned.rows.length > 0) {
        console.log(`  Found ${orphaned.rowCount} orphaned guesses for this quiz:`);
        orphaned.rows.forEach(g => {
          console.log(`    - Guess ID ${g.id}, ts=${g.ts}, session_id=${g.session_id}`);
        });
      } else {
        console.log(`  No orphaned guesses found for quiz ${session.quiz_id}`);
      }
    }
    
    await client.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();

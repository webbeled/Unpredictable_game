#!/usr/bin/env node
import { config } from 'dotenv';
import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config();

const timestamp = new Date().toISOString().slice(0, 10);

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function exportUsers() {
  try {
    const result = await client.query(`
      SELECT
        user_uuid as user_id,
        email,
        participant_code,
        gender,
        location as nationality,
        english_speaker as first_language_is_english,
        created_at
      FROM users
      ORDER BY created_at ASC
    `);

    const rows = result.rows;
    if (rows.length === 0) {
      console.log('No users found');
      return;
    }

    // Create CSV header
    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const filename = path.join(__dirname, `users_export_${timestamp}.csv`);
    fs.writeFileSync(filename, csvContent, 'utf8');
    console.log(`✓ Users exported to ${filename} (${rows.length} rows)`);
  } catch (err) {
    console.error('Error exporting users:', err.message);
  }
}

async function exportScores() {
  try {
    const result = await client.query(`
      SELECT
        qs.id as session_id,
        u.user_uuid as user_id,
        u.participant_code,
        u.location as nationality,
        u.english_speaker as first_language_is_english,
        qs.quiz_id as paragraph_id,
        qs.score as final_score,
        to_timestamp(qs.created_at::double precision / 1000) AT TIME ZONE 'UTC' as session_start,
        to_timestamp(qs.ended_at::double precision / 1000) AT TIME ZONE 'UTC' as session_end,
        qs.adj_correct,
        qs.func_correct,
        qs.noun_correct,
        qs.num_correct,
        qs.propn_correct,
        qs.verb_correct,
        COUNT(g.id) as total_guesses,
        COUNT(g.id) FILTER (WHERE g.correct = true) as correct_guesses
      FROM quiz_sessions qs
      LEFT JOIN users u ON qs.user_id = u.user_uuid
      LEFT JOIN guesses g ON qs.id = g.session_id
      GROUP BY qs.id, u.user_uuid, u.participant_code, u.location, u.english_speaker,
               qs.quiz_id, qs.score, qs.created_at, qs.ended_at,
               qs.adj_correct, qs.func_correct, qs.noun_correct, qs.num_correct, qs.propn_correct, qs.verb_correct
      ORDER BY qs.created_at ASC
    `);

    const rows = result.rows;
    if (rows.length === 0) {
      console.log('No game scores found');
      return;
    }

    // Create CSV header
    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const filename = path.join(__dirname, `game_scores_export_${timestamp}.csv`);
    fs.writeFileSync(filename, csvContent, 'utf8');
    console.log(`✓ Game scores exported to ${filename} (${rows.length} rows)`);
  } catch (err) {
    console.error('Error exporting scores:', err.message);
  }
}

async function exportGuesses() {
  try {
    const result = await client.query(`
      SELECT
        u.user_uuid as user_id,
        u.participant_code,
        u.location as nationality,
        u.english_speaker as first_language_is_english,
        g.session_id,
        g.quiz_id as paragraph_id,
        to_timestamp(qs.created_at::double precision / 1000) AT TIME ZONE 'UTC' as session_start,
        qs.score as final_score,
        g.guess_order,
        to_timestamp(g.ts::double precision / 1000) AT TIME ZONE 'UTC' as guess_time,
        g.guessed_word,
        g.part_of_speech,
        g.correct,
        g.score_before_guess,
        g.score_after_guess
      FROM guesses g
      LEFT JOIN quiz_sessions qs ON g.session_id = qs.id
      LEFT JOIN users u ON qs.user_id = u.user_uuid
      ORDER BY g.session_id, g.guess_order
    `);

    const rows = result.rows;
    if (rows.length === 0) {
      console.log('No guesses found');
      return;
    }

    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row =>
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const filename = path.join(__dirname, `guesses_export_${timestamp}.csv`);
    fs.writeFileSync(filename, csvContent, 'utf8');
    console.log(`✓ Guesses exported to ${filename} (${rows.length} rows)`);
  } catch (err) {
    console.error('Error exporting guesses:', err.message);
  }
}

async function main() {
  try {
    await client.connect();
    console.log('Connected to database...\n');

    await exportUsers();
    await exportScores();
    await exportGuesses();

    console.log('\n✓ Export complete!');
    await client.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();

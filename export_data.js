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

const now = new Date();
const timestamp = now.toISOString().replace('T', '_').slice(0, 16).replace(':', '-');

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

function cleanOldExports(prefix) {
  const files = fs.readdirSync(__dirname).filter(f => f.startsWith(prefix) && f.endsWith('.csv'));
  files.forEach(f => fs.unlinkSync(path.join(__dirname, f)));
}

async function exportUsers() {
  try {
    const result = await client.query(`
      SELECT
        u.user_uuid as user_id,
        u.email,
        u.participant_code,
        u.gender,
        u.location as nationality,
        u.english_speaker as first_language_is_english,
        u.age,
        u.prolific_id,
        u.created_at,
        COALESCE(SUM(qs.score), 0) as total_score
      FROM users u
      LEFT JOIN quiz_sessions qs ON qs.user_id = u.user_uuid
      GROUP BY u.user_uuid, u.email, u.participant_code, u.gender, u.location, u.english_speaker, u.age, u.prolific_id, u.created_at
      ORDER BY u.created_at ASC
    `);

    const rows = result.rows;
    if (rows.length === 0) { console.log('No users found'); return; }

    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row =>
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          const str = String(value);
          return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
        }).join(',')
      )
    ].join('\n');

    cleanOldExports('users_export_');
    const filename = path.join(__dirname, `users_export_${timestamp}.csv`);
    fs.writeFileSync(filename, csvContent, 'utf8');
    console.log(`✓ Users exported to ${filename} (${rows.length} rows)`);
  } catch (err) {
    console.error('Error exporting users:', err.message);
  }
}

async function exportGuesses() {
  try {
    const result = await client.query(`
      SELECT
        u.id as user_id,
        u.participant_code,
        g.session_id,
        g.quiz_id as paragraph_id,
        u.english_speaker,
        qs.created_at as session_start_ms,
        qs.ended_at as session_end_ms,
        qs.score as final_session_score,
        g.guess_order,
        g.ts as guess_time_ms,
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
    if (rows.length === 0) { console.log('No guesses found'); return; }

    const headers = [
      'user_id', 'participant_code', 'session_id', 'paragraph_id', 'language',
      'session_start_ms', 'session_start_readable',
      'session_end_ms', 'session_end_readable',
      'final_session_score', 'guess_order', 'guess_time_ms', 'guess_time_readable',
      'guessed_word', 'part_of_speech', 'correct', 'score_before_guess', 'score_after_guess'
    ];

    function toReadable(ms) {
      if (!ms) return '';
      return new Date(Number(ms)).toUTCString();
    }

    function getLanguage(englishSpeaker) {
      if (englishSpeaker === true) return 'english';
      if (englishSpeaker === false) return 'french';
      return 'unknown';
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => [
        row.user_id || '',
        row.participant_code || '',
        row.session_id || '',
        row.paragraph_id || '',
        getLanguage(row.english_speaker),
        row.session_start_ms || '',
        toReadable(row.session_start_ms),
        row.session_end_ms || '',
        toReadable(row.session_end_ms),
        row.final_session_score ?? '',
        row.guess_order ?? '',
        row.guess_time_ms || '',
        toReadable(row.guess_time_ms),
        row.guessed_word || '',
        row.part_of_speech || '',
        row.correct ? '1' : '0',
        row.score_before_guess ?? '',
        row.score_after_guess ?? ''
      ].map(val => {
        const str = String(val);
        return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(','))
    ].join('\n');

    cleanOldExports('guesses_export_');
    const filename = path.join(__dirname, `guesses_export_${timestamp}.csv`);
    fs.writeFileSync(filename, csvContent, 'utf8');
    console.log(`✓ Guesses exported to ${filename} (${rows.length} rows)`);
  } catch (err) {
    console.error('Error exporting guesses:', err.message);
  }
}

async function exportFeedback() {
  try {
    const result = await client.query(`
      SELECT participant_code, feedback_text, created_at
      FROM feedback
      ORDER BY created_at ASC
    `);

    const rows = result.rows;
    if (rows.length === 0) { console.log('No feedback found'); return; }

    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row =>
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          const str = String(value);
          return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
        }).join(',')
      )
    ].join('\n');

    cleanOldExports('feedback_export_');
    const filename = path.join(__dirname, `feedback_export_${timestamp}.csv`);
    fs.writeFileSync(filename, csvContent, 'utf8');
    console.log(`✓ Feedback exported to ${filename} (${rows.length} rows)`);
  } catch (err) {
    console.error('Error exporting feedback:', err.message);
  }
}

async function main() {
  try {
    await client.connect();
    console.log('Connected to database...\n');

    await exportUsers();
    await exportGuesses();
    await exportFeedback();

    console.log('\n✓ Export complete!');
    await client.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();

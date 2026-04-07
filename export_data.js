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

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function exportUsers() {
  try {
    const result = await client.query(`
      SELECT 
        id,
        email,
        participant_code,
        nationality,
        gender,
        first_language_is_english,
        created_at
      FROM users
      ORDER BY created_at DESC
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

    const filename = path.join(__dirname, 'users_export.csv');
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
        u.email,
        u.participant_code,
        qs.quiz_id,
        qs.score,
        qs.created_at,
        qs.ended_at,
        COUNT(g.id) as total_guesses,
        COUNT(g.id) FILTER (WHERE g.correct = true) as correct_guesses
      FROM quiz_sessions qs
      LEFT JOIN users u ON qs.user_id = u.id
      LEFT JOIN guesses g ON qs.id = g.session_id
      GROUP BY qs.id, u.email, u.participant_code, qs.quiz_id, qs.score, qs.created_at, qs.ended_at
      ORDER BY qs.created_at DESC
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

    const filename = path.join(__dirname, 'game_scores_export.csv');
    fs.writeFileSync(filename, csvContent, 'utf8');
    console.log(`✓ Game scores exported to ${filename} (${rows.length} rows)`);
  } catch (err) {
    console.error('Error exporting scores:', err.message);
  }
}

async function main() {
  try {
    await client.connect();
    console.log('Connected to database...\n');
    
    await exportUsers();
    await exportScores();
    
    console.log('\n✓ Export complete!');
    await client.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();

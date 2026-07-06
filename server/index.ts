import 'dotenv/config'
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { getRandomQuiz, getQuizAnswer, checkGuess, getRandomUnseenQuiz, getDailyQuiz, getNextDailyReset, getDayEpoch } from './data.js';
import { pool } from './db/index.js';

import authRouter from './auth.js';
import quizSessionsRouter from './quizSessions.js';
import guessesRouter from './guesses.js';
import feedbackRouter from './feedback.js'


const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "localhost";

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/quiz-sessions', quizSessionsRouter);
app.use('/api/guesses', guessesRouter);
app.use('/api/feedback', feedbackRouter);

// API endpoint to get a random quiz
app.get('/api/quiz/', (req, res) => {
  try {
    const lang = (req.query.lang as string || 'en').toLowerCase() as 'en' | 'fr';
    const quiz = getRandomQuiz(lang);
    res.json(quiz);
  } catch (error) {
    console.error('Error getting random quiz:', error);
    res.status(500).json({
      error: 'Failed to get random quiz',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Daily article — same for every user, resets at 2AM GMT
app.get('/api/quiz/daily', async (req, res) => {
  try {
    const lang = (req.query.lang as string || 'en').toLowerCase() as 'en' | 'fr';
    const quiz = getDailyQuiz(lang);
    const nextReset = getNextDailyReset();
    const dayEpoch = getDayEpoch();

    let alreadyPlayed = false;
    let previousScore = 0;

    const token = req.cookies?.token;
    if (token) {
      try {
        const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
        if (!UUID_RE.test(payload.userId)) throw new Error('not a uuid')
        const result = await pool.query(
          'SELECT score FROM daily_plays WHERE user_uuid = $1 AND day_epoch = $2',
          [payload.userId, dayEpoch]
        );
        if (result.rows.length > 0) {
          alreadyPlayed = true;
          previousScore = result.rows[0].score;
        }
      } catch {
        // Invalid token, or daily_plays table not yet created — treat as not played
      }
    }

    res.json({ ...quiz, nextReset: nextReset.toISOString(), alreadyPlayed, previousScore });
  } catch (error) {
    console.error('Error getting daily quiz:', error);
    res.status(500).json({ error: 'Failed to get daily quiz' });
  }
});

// Record that a user has completed today's daily article
app.post('/api/quiz/daily/played', async (req, res) => {
  const token = req.cookies?.token;
  if (!token) { res.status(401).json({ error: 'Not authenticated' }); return; }

  let userId: string;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    userId = payload.userId;
  } catch {
    res.status(401).json({ error: 'Invalid token' }); return;
  }

  if (!UUID_RE.test(userId)) { res.status(401).json({ error: 'Session expired, please log in again' }); return; }

  const score = typeof req.body.score === 'number' ? req.body.score : 0;
  const dayEpoch = getDayEpoch();

  try {
    await pool.query(
      `INSERT INTO daily_plays (user_uuid, day_epoch, score) VALUES ($1, $2, $3)
       ON CONFLICT (user_uuid, day_epoch) DO UPDATE SET score = GREATEST(daily_plays.score, EXCLUDED.score)`,
      [userId, dayEpoch, score]
    );
  } catch {
    // daily_plays table not yet created — ignore (local dev without migration)
  }

  res.json({ ok: true });
});

// API endpoint to get a random unseen quiz (respects user's seen articles)
app.get('/api/quiz/new/', (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    let userId: number;
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
      userId = payload.userId;
    } catch {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    const lang = (req.query.lang as string || 'en').toLowerCase() as 'en' | 'fr';

    const quiz = getRandomUnseenQuiz(String(userId), lang);
    res.json(quiz);
  } catch (error) {
    console.error('Error getting unseen quiz:', error);
    res.status(500).json({
      error: 'Failed to get unseen quiz',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API endpoint to get quiz answer by ID
// This api is supposed to be hit only when the user fails the quiz (give up or time is up).
app.get('/api/quiz/:id/answer', (req, res) => {
  try {
    const { id } = req.params;
    const answer = getQuizAnswer(id);

    if (!answer) {
      res.status(404).json({
        error: 'Quiz not found',
        message: `No quiz found with id: ${id}`
      });
      return;
    }

    res.json(answer);
  } catch (error) {
    console.error('Error getting quiz answer:', error);
    res.status(500).json({
      error: 'Failed to get quiz answer',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API endpoint to check a guess
app.post('/api/quiz/:id/guess', (req, res) => {
  try {
    const { id } = req.params;
    const { guess } = req.body;

    if (!guess || typeof guess !== 'string') {
      res.status(400).json({
        error: 'Invalid request',
        message: 'Guess must be a non-empty string'
      });
      return;
    }

    const result = checkGuess(id, guess);

    if (result === null) {
      res.status(404).json({
        error: 'Quiz not found',
        message: `No quiz found with id: ${id}`
      });
      return;
    }

    // If correct, return the mask and word
    if (result !== false) {
      res.json({
        correct: true,
        mask: result.mask,
        word: result.word
      });
    } else {
      res.json({ correct: false });
    }
  } catch (error) {
    console.error('Error checking guess:', error);
    res.status(500).json({
      error: 'Failed to check guess',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});

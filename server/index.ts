import 'dotenv/config'
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { getRandomQuiz, getQuizAnswer, checkGuess, getRandomUnseenQuiz } from './data.js';
import { pool } from './db/index.js';
import authRouter from './auth.js';
import quizSessionsRouter from './quizSessions.js';

const app = express();
const PORT = process.env.PORT || 3001;

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production'

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/quiz-sessions', quizSessionsRouter);

// API endpoint to get a random quiz
app.get('/api/quiz/', (req, res) => {
  try {
    const quiz = getRandomQuiz();
    res.json(quiz);
  } catch (error) {
    console.error('Error getting random quiz:', error);
    res.status(500).json({
      error: 'Failed to get random quiz',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API endpoint to get a random unseen quiz (respects user's seen articles)
app.get('/api/quiz/new/', async (req, res) => {
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

    // Get all articles the user has seen
    const result = await pool.query(
      'SELECT article_id FROM seen_articles WHERE user_id = $1',
      [userId]
    );
    const seenIds = new Set(result.rows.map(row => row.article_id));

    // Get a random unseen quiz
    const quiz = getRandomUnseenQuiz(seenIds);
    
    if (!quiz) {
      res.status(500).json({ error: 'No quizzes available' });
      return;
    }
    
    // Mark this article as seen
    await pool.query(
      'INSERT INTO seen_articles (user_id, article_id, viewed_at) VALUES ($1, $2, $3) ON CONFLICT (user_id, article_id) DO UPDATE SET viewed_at = $3',
      [userId, quiz.id, Date.now()]
    );

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

    console.log('Received guess:', guess, 'for quiz:', id);

    if (!guess || typeof guess !== 'string') {
      res.status(400).json({
        error: 'Invalid request',
        message: 'Guess must be a non-empty string'
      });
      return;
    }

    const result = checkGuess(id, guess);
    console.log('Check guess result:', result);

    if (result === null) {
      res.status(404).json({
        error: 'Quiz not found',
        message: `No quiz found with id: ${id}`
      });
      return;
    }

    // If correct, return the mask and word
    if (result !== false) {
      console.log('Guess is correct! Returning:', { correct: true, mask: result.mask, word: result.word });
      res.json({
        correct: true,
        mask: result.mask,
        word: result.word
      });
    } else {
      console.log('Guess is incorrect');
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

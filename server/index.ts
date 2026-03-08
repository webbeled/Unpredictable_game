import 'dotenv/config'
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { getRandomQuiz, getQuizAnswer, checkGuess } from './data.js';
import authRouter from './auth.js';
import quizSessionsRouter from './quizSessions.js';

const app = express();
const PORT = process.env.PORT || 3001;

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

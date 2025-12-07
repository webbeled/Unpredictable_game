import express from 'express';
import cors from 'cors';
import { getRandomQuiz, getQuizAnswer, checkGuess } from './data';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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
// 
// TODO(rfuwa): Track user session. The user identity depends on the requirements.
// If the app wants to track the user quiz scores over multiple games, then we might as well have
// auth in place. On the other hand, if it is only per game, then a name input at the beginning of a game suffices.
//
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

    const isCorrect = checkGuess(id, guess);

    if (isCorrect === null) {
      res.status(404).json({
        error: 'Quiz not found',
        message: `No quiz found with id: ${id}`
      });
      return;
    }

    // If correct, return the solution
    if (isCorrect) {
      const answer = getQuizAnswer(id);
      res.json({
        correct: true,
        solution: answer?.solution
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

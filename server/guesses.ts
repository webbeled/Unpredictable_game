import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { pool } from './db/index.js'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production'

router.post('/', async (req: Request, res: Response) => {
  // Allow anonymous guesses: if a valid token exists, set userId and userEmail; otherwise proceed with nulls
  const token = req.cookies?.token
  let userId: number | null = null
  let userEmail: string | null = null
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: number; email: string }
      userId = payload.userId
      userEmail = payload.email ?? null
    } catch (err) {
      // Invalid token: log and continue with anonymous (null) values
      console.warn('Invalid or expired token when saving guess, proceeding as anonymous')
      userId = null
      userEmail = null
    }
  }

  const {
    session_id,
    quiz_id,
    guess_order,
    ts,
    guessed_word,
    part_of_speech,
    correct,
    score_before_guess,
    score_after_guess,
  } = req.body

  try {
    const result = await pool.query(
      `INSERT INTO guesses (
        session_id, quiz_id, user_id, user_email, guess_order, ts, guessed_word, part_of_speech, correct, score_before_guess, score_after_guess
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [
        session_id ?? null,
        quiz_id ?? null,
        userId,
        userEmail,
        guess_order ?? null,
        ts ?? Date.now(),
        guessed_word ?? null,
        part_of_speech ?? null,
        correct ?? null,
        score_before_guess ?? null,
        score_after_guess ?? null,
      ]
    )
    res.status(201).json({ id: result.rows[0].id })
  } catch (err) {
    console.error('Error saving guess:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Attach session to previously logged guesses for a quiz
router.post('/attach-session', async (req: Request, res: Response) => {
  const { session_id, quiz_id } = req.body
  if (!session_id || !quiz_id) {
    res.status(400).json({ error: 'session_id and quiz_id are required' })
    return
  }

  try {
    await pool.query(
      `UPDATE guesses
       SET session_id = $1
       WHERE quiz_id = $2
         AND session_id IS NULL`,
      [session_id, quiz_id]
    )
    res.json({ success: true })
  } catch (err) {
    console.error('Error attaching session to guesses:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

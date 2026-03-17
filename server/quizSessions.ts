import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { pool } from './db/index.js'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production'

router.get('/', async (req: Request, res: Response) => {
  const token = req.cookies?.token
  if (!token) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }

  let userId: number
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number; email: string }
    userId = payload.userId
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }

  try {
    const result = await pool.query(
      `SELECT quiz_id, score, created_at, ended_at FROM quiz_sessions
       WHERE user_id = $1 ORDER BY created_at ASC`,
      [userId]
    )
    res.json(result.rows)
  } catch (err) {
    console.error('Error fetching quiz sessions:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', async (req: Request, res: Response) => {
  const token = req.cookies?.token
  if (!token) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }

  let userId: number
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number; email: string }
    userId = payload.userId
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }

  const {
    quiz_id,
    score,
    guessed_words,
    ended_at,
    created_at,
    // New POS-specific fields (from frontend)
    adj_correct,
    adj_guesses,
    func_correct,
    func_guesses,
    noun_correct,
    noun_guesses,
    num_correct,
    num_guesses,
    propn_correct,
    propn_guesses,
    verb_correct,
    verb_guesses,
    // Score before guess (from frontend)
    adj_score_before_guess,
    func_score_before_guess,
    noun_score_before_guess,
    num_score_before_guess,
    propn_score_before_guess,
    verb_score_before_guess,
  } = req.body

  if (!quiz_id || score === undefined || !created_at) {
    res.status(400).json({ error: 'Missing required fields' })
    return
  }

  try {
    const result = await pool.query(
      `INSERT INTO quiz_sessions (
        quiz_id, user_id, score, guessed_words, ended_at, created_at,
        adj_correct, adj_guesses, adj_score_before_guess,
        func_correct, func_guesses, func_score_before_guess,
        noun_correct, noun_guesses, noun_score_before_guess,
        num_correct, num_guesses, num_score_before_guess,
        propn_correct, propn_guesses, propn_score_before_guess,
        verb_correct, verb_guesses, verb_score_before_guess
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
       RETURNING id, quiz_id`,
      [
        quiz_id,
        userId,
        score,
        JSON.stringify(guessed_words ?? []),
        ended_at ?? null,
        created_at,
        adj_correct ?? 0,
        adj_guesses ?? null,
        adj_score_before_guess ?? null,
        func_correct ?? 0,
        func_guesses ?? null,
        func_score_before_guess ?? null,
        noun_correct ?? 0,
        noun_guesses ?? null,
        noun_score_before_guess ?? null,
        num_correct ?? 0,
        num_guesses ?? null,
        num_score_before_guess ?? null,
        propn_correct ?? 0,
        propn_guesses ?? null,
        propn_score_before_guess ?? null,
        verb_correct ?? 0,
        verb_guesses ?? null,
        verb_score_before_guess ?? null,
      ]
    )
    res.status(201).json({ id: result.rows[0].id, quiz_id: result.rows[0].quiz_id })
  } catch (err) {
    console.error('Error saving quiz session:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

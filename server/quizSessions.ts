import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { pool } from './db/index.js'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production'

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

  const { quiz_id, score, guessed_words, ended_at, created_at } = req.body

  if (!quiz_id || score === undefined || !created_at) {
    res.status(400).json({ error: 'Missing required fields' })
    return
  }

  try {
    const result = await pool.query(
      `INSERT INTO quiz_sessions (quiz_id, user_id, score, guessed_words, ended_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [quiz_id, userId, score, JSON.stringify(guessed_words ?? []), ended_at ?? null, created_at]
    )
    res.status(201).json({ id: result.rows[0].id })
  } catch (err) {
    console.error('Error saving quiz session:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

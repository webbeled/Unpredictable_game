import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { pool } from './db/index.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production'

router.post('/', async (req: Request, res: Response) => {
  const { feedback_text } = req.body
  if (!feedback_text?.trim()) {
    res.status(400).json({ error: 'Feedback text is required' })
    return
  }

  let userId: number | null = null
  let participantCode: string | null = null

  const token = req.cookies?.token
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: any; email: string }
      const result = await pool.query(
        'SELECT id, participant_code FROM users WHERE id = $1 OR user_uuid = $2',
        [Number.isInteger(Number(payload.userId)) ? Number(payload.userId) : null, payload.userId]
      )
      if (result.rows[0]) {
        userId = result.rows[0].id
        participantCode = result.rows[0].participant_code ?? null
      }
    } catch {
      // proceed anonymously
    }
  }

  try {
    await pool.query(
      'INSERT INTO feedback (user_id, participant_code, feedback_text) VALUES ($1, $2, $3)',
      [userId, participantCode, feedback_text.trim()]
    )
    res.status(201).json({ success: true })
  } catch (err) {
    console.error('Error saving feedback:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

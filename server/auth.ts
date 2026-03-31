import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from './db/index.js'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production'

// Generate an 8-character uppercase alphanumeric participant code
function generateParticipantCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

router.post('/register', async (req: Request, res: Response) => {
  const { email, password } = req.body
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' })
    return
  }
  try {
    const passwordHash = await bcrypt.hash(password, 10)
    // Generate a unique participant_code (retry a few times on collision)
    let participantCode: string | null = null
    for (let attempt = 0; attempt < 6; attempt++) {
      const candidate = generateParticipantCode()
      const exists = await pool.query('SELECT 1 FROM users WHERE participant_code = $1', [candidate])
      if (exists.rowCount === 0) {
        participantCode = candidate
        break
      }
    }

    // Fallback: allow null participant_code if uniqueness cannot be guaranteed (very unlikely)
    await pool.query(
      'INSERT INTO users (email, password_hash, participant_code) VALUES ($1, $2, $3)',
      [email, passwordHash, participantCode]
    )
    res.status(201).json({ message: 'User created', participant_code: participantCode })
  } catch (err: unknown) {
    const pgErr = err as { code?: string }
    if (pgErr.code === '23505') {
      res.status(409).json({ error: 'Email already registered' })
    } else {
      console.error('Register error:', err)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
})

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' })
    return
  }
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    const user = result.rows[0]
    if (!user) {
      res.status(404).json({ error: 'No account found with this email' })
      return
    }
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    res.json({ id: user.id, email: user.email, participant_code: user.participant_code ?? null })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token')
  res.json({ message: 'Logged out' })
})

router.get('/me', (req: Request, res: Response) => {
  const token = req.cookies?.token
  if (!token) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number; email: string }
    // Look up participant_code for this user for convenience (does not expose email for exports)
    pool.query('SELECT participant_code FROM users WHERE id = $1', [payload.userId])
      .then((r) => {
        const code = r.rows[0]?.participant_code ?? null
        res.json({ id: payload.userId, email: payload.email, participant_code: code })
      })
      .catch((err) => {
        console.error('Error fetching participant code:', err)
        res.json({ id: payload.userId, email: payload.email, participant_code: null })
      })
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
})

export default router

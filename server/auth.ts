import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from './db/index.js'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production'

router.post('/register', async (req: Request, res: Response) => {
  const { email, password } = req.body
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' })
    return
  }
  try {
    const passwordHash = await bcrypt.hash(password, 10)
    await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2)',
      [email, passwordHash]
    )
    res.status(201).json({ message: 'User created' })
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
    res.json({ id: user.id, email: user.email })
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
    res.json({ id: payload.userId, email: payload.email })
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
})

export default router

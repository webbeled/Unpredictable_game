import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { pool } from './db/index.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production'

function getUserId(req: Request): string | null {
  try {
    const token = req.cookies?.token
    if (!token) return null
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string }
    return payload.userId
  } catch { return null }
}

// Send a friend request by participant_code
router.post('/request', async (req: Request, res: Response) => {
  const userId = getUserId(req)
  if (!userId) { res.status(401).json({ error: 'Not authenticated' }); return }

  const { participant_code } = req.body
  if (!participant_code) { res.status(400).json({ error: 'participant_code required' }); return }

  try {
    const receiver = await pool.query('SELECT user_uuid FROM users WHERE participant_code = $1', [participant_code.toUpperCase()])
    if (receiver.rows.length === 0) { res.status(404).json({ error: 'User not found' }); return }

    const receiverId = receiver.rows[0].user_uuid
    if (receiverId === userId) { res.status(400).json({ error: 'Cannot add yourself' }); return }

    const existing = await pool.query(
      `SELECT id FROM friend_requests WHERE
       ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))
       AND status = 'pending'`,
      [userId, receiverId]
    )
    if (existing.rows.length > 0) { res.status(409).json({ error: 'Request already sent' }); return }

    const alreadyFriends = await pool.query(
      `SELECT id FROM friend_requests WHERE
       ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))
       AND status = 'accepted'`,
      [userId, receiverId]
    )
    if (alreadyFriends.rows.length > 0) { res.status(409).json({ error: 'Already friends' }); return }

    await pool.query(
      'INSERT INTO friend_requests (sender_id, receiver_id, status, created_at) VALUES ($1, $2, $3, $4)',
      [userId, receiverId, 'pending', Date.now()]
    )
    res.status(201).json({ message: 'Friend request sent' })
  } catch (err) {
    console.error('Error sending friend request:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get pending incoming friend requests
router.get('/requests', async (req: Request, res: Response) => {
  const userId = getUserId(req)
  if (!userId) { res.status(401).json({ error: 'Not authenticated' }); return }

  try {
    const result = await pool.query(`
      SELECT fr.id, u.participant_code as sender_code, fr.created_at
      FROM friend_requests fr
      JOIN users u ON fr.sender_id = u.user_uuid
      WHERE fr.receiver_id = $1 AND fr.status = 'pending'
      ORDER BY fr.created_at DESC
    `, [userId])
    res.json(result.rows)
  } catch (err) {
    console.error('Error fetching friend requests:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Accept a request
router.post('/accept/:id', async (req: Request, res: Response) => {
  const userId = getUserId(req)
  if (!userId) { res.status(401).json({ error: 'Not authenticated' }); return }

  try {
    await pool.query(
      'UPDATE friend_requests SET status = $1 WHERE id = $2 AND receiver_id = $3',
      ['accepted', req.params.id, userId]
    )
    res.json({ message: 'Friend request accepted' })
  } catch (err) {
    console.error('Error accepting request:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Decline a request
router.post('/decline/:id', async (req: Request, res: Response) => {
  const userId = getUserId(req)
  if (!userId) { res.status(401).json({ error: 'Not authenticated' }); return }

  try {
    await pool.query(
      'UPDATE friend_requests SET status = $1 WHERE id = $2 AND receiver_id = $3',
      ['declined', req.params.id, userId]
    )
    res.json({ message: 'Friend request declined' })
  } catch (err) {
    console.error('Error declining request:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get friends list with total scores
router.get('/', async (req: Request, res: Response) => {
  const userId = getUserId(req)
  if (!userId) { res.status(401).json({ error: 'Not authenticated' }); return }

  try {
    const result = await pool.query(`
      SELECT u.participant_code, COALESCE(SUM(qs.score), 0) as total_score, COUNT(qs.id) as games_played
      FROM (
        SELECT receiver_id as friend_id FROM friend_requests WHERE sender_id = $1 AND status = 'accepted'
        UNION
        SELECT sender_id as friend_id FROM friend_requests WHERE receiver_id = $1 AND status = 'accepted'
      ) friends
      JOIN users u ON u.user_uuid = friends.friend_id
      LEFT JOIN quiz_sessions qs ON qs.user_id = u.user_uuid
      GROUP BY u.participant_code
      ORDER BY total_score DESC
    `, [userId])
    res.json(result.rows)
  } catch (err) {
    console.error('Error fetching friends:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get a friend's quiz sessions (only if mutual friends)
router.get('/:participant_code/stats', async (req: Request, res: Response) => {
  const userId = getUserId(req)
  if (!userId) { res.status(401).json({ error: 'Not authenticated' }); return }

  const { participant_code } = req.params

  try {
    const friendResult = await pool.query('SELECT user_uuid FROM users WHERE participant_code = $1', [participant_code])
    if (friendResult.rows.length === 0) { res.status(404).json({ error: 'User not found' }); return }

    const friendId = friendResult.rows[0].user_uuid

    const friendCheck = await pool.query(`
      SELECT id FROM friend_requests WHERE
      ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))
      AND status = 'accepted'
    `, [userId, friendId])
    if (friendCheck.rows.length === 0) { res.status(403).json({ error: 'Not friends' }); return }

    const result = await pool.query(`
      SELECT
        qs.id, qs.quiz_id, qs.score, qs.created_at, qs.ended_at,
        json_agg(
          json_build_object('part_of_speech', g.part_of_speech)
          ORDER BY g.guess_order
        ) FILTER (WHERE g.correct = true) as correct_guesses
      FROM quiz_sessions qs
      LEFT JOIN guesses g ON qs.id = g.session_id
      WHERE qs.user_id = $1
      GROUP BY qs.id, qs.quiz_id, qs.score, qs.created_at, qs.ended_at
      ORDER BY qs.created_at ASC
    `, [friendId])

    res.json(result.rows)
  } catch (err) {
    console.error('Error fetching friend stats:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

import { Router } from 'express'
import pool from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  const q = (req.query.q || '').trim()
  if (!q) return res.json({ users: [], posts: [] })

  const like = `%${q}%`

  const [users] = await pool.query(
    `SELECT id, name, username, avatar_url AS avatarUrl
     FROM users
     WHERE (name LIKE ? OR username LIKE ?) AND id != ?
     LIMIT 8`,
    [like, like, req.userId]
  )

  const [posts] = await pool.query(
    `SELECT p.id, p.content, p.created_at,
            u.id AS author_id, u.name AS author_name, u.username AS author_username
     FROM posts p
     JOIN users u ON u.id = p.user_id
     WHERE p.content LIKE ?
     ORDER BY p.created_at DESC
     LIMIT 8`,
    [like]
  )

  res.json({ users, posts })
})

export default router

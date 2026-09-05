import { Router } from 'express'
import pool from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT n.id, n.type, n.is_read AS isRead, n.created_at AS createdAt,
            n.post_id AS postId, n.comment_id AS commentId, n.message,
            a.id AS actorId, a.name AS actorName, a.username AS actorUsername, a.avatar_url AS actorAvatarUrl
     FROM notifications n
     JOIN users a ON a.id = n.actor_id
     WHERE n.user_id = ?
     ORDER BY n.created_at DESC
     LIMIT 50`,
    [req.userId]
  )
  res.json({ notifications: rows })
})

router.get('/unread-count', requireAuth, async (req, res) => {
  const [[{ count }]] = await pool.query(
    'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = FALSE',
    [req.userId]
  )
  res.json({ count })
})

router.put('/read-all', requireAuth, async (req, res) => {
  await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [req.userId])
  res.status(204).end()
})

router.put('/:id/read', requireAuth, async (req, res) => {
  await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
  res.status(204).end()
})

export default router

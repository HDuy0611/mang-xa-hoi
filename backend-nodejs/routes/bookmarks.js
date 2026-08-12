import { Router } from 'express'
import pool from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT p.id, p.content, p.image_url AS imageUrl, p.created_at, p.user_id AS authorId,
            u.id AS author_id, u.name AS author_name, u.username AS author_username, u.avatar_url AS author_avatar_url,
            (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) AS likes,
            (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments,
            EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = ?) AS liked,
            TRUE AS bookmarked
     FROM bookmarks b
     JOIN posts p ON p.id = b.post_id
     JOIN users u ON u.id = p.user_id
     WHERE b.user_id = ?
     ORDER BY b.created_at DESC`,
    [req.userId, req.userId]
  )
  res.json({ posts: rows })
})

router.post('/:postId', requireAuth, async (req, res) => {
  await pool.query(
    'INSERT IGNORE INTO bookmarks (user_id, post_id) VALUES (?, ?)',
    [req.userId, req.params.postId]
  )
  res.status(201).json({ bookmarked: true })
})

router.delete('/:postId', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM bookmarks WHERE user_id = ? AND post_id = ?', [req.userId, req.params.postId])
  res.status(204).end()
})

export default router

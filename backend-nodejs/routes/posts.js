import { Router } from 'express'
import pool from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'
import { createNotification } from '../lib/notify.js'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  const { userId } = req.query

  const params = [req.userId]
  let where = ''
  if (userId) {
    where = 'WHERE p.user_id = ?'
    params.push(userId)
  }

  const [rows] = await pool.query(
    `SELECT p.id, p.content, p.image_url AS imageUrl, p.created_at, p.user_id AS authorId,
            p.comment_permission AS commentPermission, p.allow_sharing AS allowSharing,
            u.id AS author_id, u.name AS author_name, u.username AS author_username, u.avatar_url AS author_avatar_url,
            (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) AS likes,
            (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments,
            EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = ?) AS liked,
            EXISTS(SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = ?) AS bookmarked
     FROM posts p
     JOIN users u ON u.id = p.user_id
     ${where}
     ORDER BY p.created_at DESC
     LIMIT 50`,
    [req.userId, ...params]
  )

  res.json({ posts: rows })
})

const COMMENT_PERMISSIONS = ['everyone', 'friends', 'nobody']

router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  const content = req.body?.content?.trim()

  if (!content) {
    return res.status(400).json({ message: 'Nội dung bài viết không được để trống.' })
  }

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null
  const commentPermission = COMMENT_PERMISSIONS.includes(req.body?.commentPermission)
    ? req.body.commentPermission
    : 'everyone'
  const allowSharing = req.body?.allowSharing !== 'false'

  const [result] = await pool.query(
    'INSERT INTO posts (user_id, content, image_url, comment_permission, allow_sharing) VALUES (?, ?, ?, ?, ?)',
    [req.userId, content, imageUrl, commentPermission, allowSharing]
  )

  res.status(201).json({ id: result.insertId })
})

router.post('/:id/like', requireAuth, async (req, res) => {
  const postId = req.params.id

  const [existing] = await pool.query(
    'SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?',
    [postId, req.userId]
  )

  if (existing.length > 0) {
    await pool.query('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, req.userId])
  } else {
    await pool.query('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [postId, req.userId])

    const [[post]] = await pool.query('SELECT user_id FROM posts WHERE id = ?', [postId])
    if (post) {
      await createNotification({ userId: post.user_id, actorId: req.userId, type: 'like', postId })
    }
  }

  const [[{ count }]] = await pool.query(
    'SELECT COUNT(*) AS count FROM post_likes WHERE post_id = ?',
    [postId]
  )

  res.json({ liked: existing.length === 0, likes: count })
})

router.get('/:id/comments', requireAuth, async (req, res) => {
  const postId = req.params.id

  const [rows] = await pool.query(
    `SELECT c.id, c.content, c.created_at, c.user_id AS authorId,
            u.id AS author_id, u.name AS author_name, u.username AS author_username, u.avatar_url AS author_avatar_url
     FROM comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.post_id = ?
     ORDER BY c.created_at ASC`,
    [postId]
  )

  res.json({ comments: rows })
})

router.post('/:id/comments', requireAuth, async (req, res) => {
  const postId = req.params.id
  const content = req.body?.content?.trim()

  if (!content) {
    return res.status(400).json({ message: 'Bình luận không được để trống.' })
  }

  const [[post]] = await pool.query('SELECT user_id, comment_permission FROM posts WHERE id = ?', [postId])
  if (!post) {
    return res.status(404).json({ message: 'Bài viết không tồn tại.' })
  }

  if (post.user_id !== req.userId) {
    if (post.comment_permission === 'nobody') {
      return res.status(403).json({ message: 'Bài viết này đã tắt bình luận.' })
    }
    if (post.comment_permission === 'friends') {
      const [rel] = await pool.query(
        `SELECT 1 FROM friendships WHERE status = 'accepted'
         AND ((requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?))`,
        [req.userId, post.user_id, post.user_id, req.userId]
      )
      if (rel.length === 0) {
        return res.status(403).json({ message: 'Chỉ bạn bè của tác giả mới có thể bình luận bài viết này.' })
      }
    }
  }

  const [result] = await pool.query(
    'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
    [postId, req.userId, content]
  )

  await createNotification({ userId: post.user_id, actorId: req.userId, type: 'comment', postId, commentId: result.insertId })

  res.status(201).json({ id: result.insertId })
})

router.delete('/:id', requireAuth, async (req, res) => {
  const postId = req.params.id

  const [rows] = await pool.query('SELECT user_id FROM posts WHERE id = ?', [postId])
  const post = rows[0]

  if (!post) {
    return res.status(404).json({ message: 'Bài viết không tồn tại.' })
  }
  if (post.user_id !== req.userId) {
    return res.status(403).json({ message: 'Bạn không có quyền xoá bài viết này.' })
  }

  await pool.query('DELETE FROM posts WHERE id = ?', [postId])
  res.status(204).end()
})

router.delete('/:postId/comments/:commentId', requireAuth, async (req, res) => {
  const { commentId } = req.params

  const [rows] = await pool.query('SELECT user_id FROM comments WHERE id = ?', [commentId])
  const comment = rows[0]

  if (!comment) {
    return res.status(404).json({ message: 'Bình luận không tồn tại.' })
  }
  if (comment.user_id !== req.userId) {
    return res.status(403).json({ message: 'Bạn không có quyền xoá bình luận này.' })
  }

  await pool.query('DELETE FROM comments WHERE id = ?', [commentId])
  res.status(204).end()
})

export default router

import pool from '../db.js'

export async function createNotification({ userId, actorId, type, postId = null, commentId = null }) {
  if (userId === actorId) return

  await pool.query(
    'INSERT INTO notifications (user_id, actor_id, type, post_id, comment_id) VALUES (?, ?, ?, ?, ?)',
    [userId, actorId, type, postId, commentId]
  )
}

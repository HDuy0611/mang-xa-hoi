import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql')
const schemaSql = fs.readFileSync(schemaPath, 'utf8')

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  multipleStatements: true,
})

await connection.query(schemaSql)

async function addColumnIfMissing(sql, label) {
  try {
    await connection.query(sql)
    console.log(`Added column: ${label}`)
  } catch (err) {
    if (err.code !== 'ER_DUP_FIELDNAME') throw err
  }
}

await addColumnIfMissing(
  "ALTER TABLE nova_db.users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user'",
  'users.role'
)
await addColumnIfMissing(
  'ALTER TABLE nova_db.users ADD COLUMN is_locked BOOLEAN NOT NULL DEFAULT FALSE',
  'users.is_locked'
)
await addColumnIfMissing(
  'ALTER TABLE nova_db.users ADD COLUMN google_id VARCHAR(255) NULL UNIQUE',
  'users.google_id'
)
await addColumnIfMissing(
  'ALTER TABLE nova_db.users ADD COLUMN facebook_id VARCHAR(255) NULL UNIQUE',
  'users.facebook_id'
)
await addColumnIfMissing(
  "ALTER TABLE nova_db.posts ADD COLUMN comment_permission ENUM('everyone', 'friends', 'nobody') NOT NULL DEFAULT 'everyone'",
  'posts.comment_permission'
)
await addColumnIfMissing(
  'ALTER TABLE nova_db.posts ADD COLUMN allow_sharing BOOLEAN NOT NULL DEFAULT TRUE',
  'posts.allow_sharing'
)
await addColumnIfMissing(
  'ALTER TABLE nova_db.friendships ADD COLUMN was_friends BOOLEAN NOT NULL DEFAULT FALSE',
  'friendships.was_friends'
)
await addColumnIfMissing(
  'ALTER TABLE nova_db.users ADD COLUMN locked_until DATETIME NULL',
  'users.locked_until'
)
await addColumnIfMissing(
  'ALTER TABLE nova_db.users ADD COLUMN locked_reason VARCHAR(500) NULL',
  'users.locked_reason'
)
await addColumnIfMissing(
  'ALTER TABLE nova_db.notifications ADD COLUMN message VARCHAR(500) NULL',
  'notifications.message'
)

try {
  await connection.query('ALTER TABLE nova_db.users MODIFY COLUMN password_hash VARCHAR(255) NULL')
  console.log('Made "password_hash" nullable (for social-login-only accounts).')
} catch (err) {
  console.error('Could not modify password_hash column:', err.message)
}

try {
  await connection.query(
    "ALTER TABLE nova_db.notifications MODIFY COLUMN type ENUM('like', 'comment', 'friend_request', 'friend_accept', 'warning') NOT NULL"
  )
  console.log('Widened "notifications.type" to include \'warning\'.')
} catch (err) {
  console.error('Could not modify notifications.type column:', err.message)
}

try {
  await connection.query('DROP TABLE IF EXISTS nova_db.admin_logs')
  console.log('Dropped table "admin_logs" (feature removed).')
} catch (err) {
  console.error('Could not drop admin_logs table:', err.message)
}

await connection.end()

console.log('Migration completed: database "nova_db" and table "users" are ready.')

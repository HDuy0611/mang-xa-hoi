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

try {
  await connection.query('ALTER TABLE nova_db.users MODIFY COLUMN password_hash VARCHAR(255) NULL')
  console.log('Made "password_hash" nullable (for social-login-only accounts).')
} catch (err) {
  console.error('Could not modify password_hash column:', err.message)
}

await connection.end()

console.log('Migration completed: database "nova_db" and table "users" are ready.')

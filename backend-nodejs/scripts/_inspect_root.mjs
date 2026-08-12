import mysql from 'mysql2/promise'

const conn = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456',
})

const [dbs] = await conn.query('SHOW DATABASES')
console.log('Databases:', dbs.map(d => Object.values(d)[0]))

for (const dbName of ['nova_nodejs_db', 'nova_csharp']) {
  try {
    const [tables] = await conn.query('SHOW TABLES FROM ??', [dbName])
    const tableNames = tables.map(t => Object.values(t)[0])
    console.log(dbName, 'tables:', tableNames)
    for (const tname of tableNames) {
      const [[cnt]] = await conn.query('SELECT COUNT(*) AS c FROM ??.??', [dbName, tname])
      console.log('  ', tname, 'rows:', cnt.c)
      if (tname === 'users') {
        const [rows] = await conn.query('SELECT id, name, username, email FROM ??.??', [dbName, tname])
        console.log('    ', rows)
      }
    }
  } catch (e) {
    console.log(dbName, 'ERROR:', e.message)
  }
}

await conn.end()

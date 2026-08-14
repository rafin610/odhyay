import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required.");

const url = new URL(databaseUrl);
const connection = await mysql.createConnection({
  host: url.hostname,
  port: Number(url.port || 4000),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: decodeURIComponent(url.pathname.replace(/^\//, "")),
  ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
});

try {
  const [counts] = await connection.query(`
    SELECT 'users' AS entity, COUNT(*) AS total FROM users
    UNION ALL SELECT 'authors', COUNT(*) FROM authors
    UNION ALL SELECT 'categories', COUNT(*) FROM categories
    UNION ALL SELECT 'books', COUNT(*) FROM books
    UNION ALL SELECT 'reading_progress', COUNT(*) FROM reading_progress
    UNION ALL SELECT 'favorites', COUNT(*) FROM favorites
    UNION ALL SELECT 'bookmarks', COUNT(*) FROM bookmarks
  `);
  const [admins] = await connection.query("SELECT openId, role FROM users WHERE role = 'admin' ORDER BY openId");
  const [books] = await connection.query("SELECT slug, coverUrl, pdfKey, pdfFilename, pdfMimeType, pdfSize FROM books ORDER BY id");
  console.log(JSON.stringify({ counts, admins, books }, null, 2));
} finally {
  await connection.end();
}

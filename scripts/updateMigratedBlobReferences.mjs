import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required.");

const url = new URL(databaseUrl);
const pool = mysql.createPool({
  host: url.hostname,
  port: Number(url.port || 4000),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: decodeURIComponent(url.pathname.replace(/^\//, "")),
  ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
  connectionLimit: 2,
});

const coverUrl = "https://mkximphkslwhavpw.public.blob.vercel-storage.com/covers/migrated/ai-for-student-cover.jpg";
const pdfKey = "https://mkximphkslwhavpw.public.blob.vercel-storage.com/books/migrated/ai-for-student.pdf";

try {
  const [result] = await pool.execute(
    "UPDATE books SET coverUrl = ?, pdfKey = ? WHERE slug = ?",
    [coverUrl, pdfKey, "ai-for-student"],
  );
  if (result.affectedRows !== 1) throw new Error(`Expected one updated book, received ${result.affectedRows}.`);

  const [rows] = await pool.execute(
    "SELECT title, coverUrl, pdfKey, pdfFilename, pdfMimeType, pdfSize FROM books WHERE slug = ?",
    ["ai-for-student"],
  );
  console.log(JSON.stringify(rows[0], null, 2));
} finally {
  await pool.end();
}

import mysql from "mysql2/promise";

const sourceDatabaseUrl = process.env.SOURCE_DATABASE_URL;
const targetDatabaseUrl = process.env.DATABASE_URL;

if (!sourceDatabaseUrl) throw new Error("SOURCE_DATABASE_URL is required.");
if (!targetDatabaseUrl) throw new Error("DATABASE_URL is required for the TiDB target.");

function createConnection(databaseUrl) {
  const url = new URL(databaseUrl);
  const isTiDbCloud = url.hostname.endsWith("tidbcloud.com");
  return mysql.createConnection({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
    ...(isTiDbCloud ? { ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true } } : {}),
  });
}

const source = await createConnection(sourceDatabaseUrl);
const target = await createConnection(targetDatabaseUrl);

try {
  const [[users], [progress]] = await Promise.all([
    source.query("SELECT id, updatedAt, lastSignedIn FROM users ORDER BY id"),
    source.query("SELECT id, updatedAt FROM reading_progress ORDER BY id"),
  ]);

  const [targetUsers] = await target.query("SELECT id FROM users ORDER BY id");
  const [targetProgress] = await target.query("SELECT id FROM reading_progress ORDER BY id");
  const sameIds = (sourceRows, targetRows) => JSON.stringify(sourceRows.map((row) => row.id)) === JSON.stringify(targetRows.map((row) => row.id));
  if (!sameIds(users, targetUsers) || !sameIds(progress, targetProgress)) {
    throw new Error("Source and target IDs differ; refusing to synchronize a partial migration.");
  }

  await target.beginTransaction();
  for (const user of users) {
    await target.execute("UPDATE users SET updatedAt = ?, lastSignedIn = ? WHERE id = ?", [user.updatedAt, user.lastSignedIn, user.id]);
  }
  for (const row of progress) {
    await target.execute("UPDATE reading_progress SET updatedAt = ? WHERE id = ?", [row.updatedAt, row.id]);
  }
  await target.commit();
  console.log(JSON.stringify({ synchronizedUsers: users.length, synchronizedProgressRows: progress.length }, null, 2));
} catch (error) {
  await target.rollback().catch(() => undefined);
  throw error;
} finally {
  await Promise.all([source.end(), target.end()]);
}

import { createHash } from "node:crypto";
import mysql from "mysql2/promise";

const sourceDatabaseUrl = process.env.SOURCE_DATABASE_URL;
const targetDatabaseUrl = process.env.DATABASE_URL;
const blobBaseUrl = "https://mkximphkslwhavpw.public.blob.vercel-storage.com/";

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

function normalize(value) {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalize(item)]));
  }
  return value;
}

function digest(value) {
  return createHash("sha256").update(JSON.stringify(normalize(value))).digest("hex");
}

function sameRows(source, target) {
  return JSON.stringify(normalize(source)) === JSON.stringify(normalize(target));
}

function describeDifferences(sourceRows, targetRows) {
  const sourceById = new Map(sourceRows.map((row) => [row.id, normalize(row)]));
  const targetById = new Map(targetRows.map((row) => [row.id, normalize(row)]));
  const rowIds = [...new Set([...sourceById.keys(), ...targetById.keys()])].sort((a, b) => a - b);
  return rowIds.flatMap((id) => {
    const sourceRow = sourceById.get(id);
    const targetRow = targetById.get(id);
    if (!sourceRow || !targetRow) return [{ id, difference: sourceRow ? "missing-from-target" : "missing-from-source" }];
    const fields = [...new Set([...Object.keys(sourceRow), ...Object.keys(targetRow)])]
      .filter((field) => JSON.stringify(sourceRow[field]) !== JSON.stringify(targetRow[field]));
    const timestamps = Object.fromEntries(
      fields
        .filter((field) => field.endsWith("At"))
        .map((field) => [field, { source: sourceRow[field], target: targetRow[field] }]),
    );
    return fields.length ? [{ id, fields, ...(Object.keys(timestamps).length ? { timestamps } : {}) }] : [];
  });
}

const tableQueries = {
  users: "SELECT id, openId, name, email, loginMethod, role, createdAt, updatedAt, lastSignedIn FROM users ORDER BY id",
  authors: "SELECT id, name, bio, createdAt FROM authors ORDER BY id",
  categories: "SELECT id, name, slug, description, createdAt FROM categories ORDER BY id",
  books: "SELECT id, title, slug, description, coverUrl, pdfKey, pdfFilename, pdfMimeType, pdfSize, authorId, categoryId, pageCount, status, createdAt, updatedAt FROM books ORDER BY id",
  reading_progress: "SELECT id, userId, bookId, currentPage, progressPercentage, updatedAt FROM reading_progress ORDER BY id",
  favorites: "SELECT id, userId, bookId, createdAt FROM favorites ORDER BY id",
  bookmarks: "SELECT id, userId, bookId, pageNumber, createdAt FROM bookmarks ORDER BY id",
};

const foreignKeyChecks = {
  books_author: "SELECT COUNT(*) AS invalidRows FROM books b LEFT JOIN authors a ON a.id = b.authorId WHERE a.id IS NULL",
  books_category: "SELECT COUNT(*) AS invalidRows FROM books b LEFT JOIN categories c ON c.id = b.categoryId WHERE b.categoryId IS NOT NULL AND c.id IS NULL",
  progress_user: "SELECT COUNT(*) AS invalidRows FROM reading_progress p LEFT JOIN users u ON u.id = p.userId WHERE u.id IS NULL",
  progress_book: "SELECT COUNT(*) AS invalidRows FROM reading_progress p LEFT JOIN books b ON b.id = p.bookId WHERE b.id IS NULL",
  favorites_user: "SELECT COUNT(*) AS invalidRows FROM favorites f LEFT JOIN users u ON u.id = f.userId WHERE u.id IS NULL",
  favorites_book: "SELECT COUNT(*) AS invalidRows FROM favorites f LEFT JOIN books b ON b.id = f.bookId WHERE b.id IS NULL",
  bookmarks_user: "SELECT COUNT(*) AS invalidRows FROM bookmarks m LEFT JOIN users u ON u.id = m.userId WHERE u.id IS NULL",
  bookmarks_book: "SELECT COUNT(*) AS invalidRows FROM bookmarks m LEFT JOIN books b ON b.id = m.bookId WHERE b.id IS NULL",
};

function normalizeBooksForParity(rows, expectedOrigin) {
  return rows.map((book) => {
    const isExpectedSource = typeof book.coverUrl === "string" && book.coverUrl.startsWith("/manus-storage/")
      && typeof book.pdfKey === "string" && book.pdfKey.startsWith("books/");
    const isExpectedTarget = typeof book.coverUrl === "string" && book.coverUrl.startsWith(`${blobBaseUrl}covers/`)
      && typeof book.pdfKey === "string" && book.pdfKey.startsWith(`${blobBaseUrl}books/`);
    if ((expectedOrigin === "source" && !isExpectedSource) || (expectedOrigin === "target" && !isExpectedTarget)) {
      throw new Error(`Book ${book.id} has an unexpected ${expectedOrigin} media reference.`);
    }
    return {
      ...book,
      coverUrl: "__MIGRATED_COVER__",
      pdfKey: "__MIGRATED_PDF__",
      updatedAt: "__BLOB_REFERENCE_MIGRATION_TIMESTAMP__",
    };
  });
}

async function readSnapshot(connection) {
  const snapshot = {};
  for (const [name, query] of Object.entries(tableQueries)) {
    const [rows] = await connection.query(query);
    snapshot[name] = rows;
  }
  return snapshot;
}

async function checkForeignKeys(connection) {
  const results = {};
  for (const [name, query] of Object.entries(foreignKeyChecks)) {
    const [rows] = await connection.query(query);
    results[name] = Number(rows[0].invalidRows);
  }
  return results;
}

const source = await createConnection(sourceDatabaseUrl);
const target = await createConnection(targetDatabaseUrl);

try {
  const [sourceSnapshot, targetSnapshot, targetForeignKeys] = await Promise.all([
    readSnapshot(source),
    readSnapshot(target),
    checkForeignKeys(target),
  ]);

  const parity = {};
  const differences = {};
  for (const tableName of Object.keys(tableQueries)) {
    const sourceRows = tableName === "books"
      ? normalizeBooksForParity(sourceSnapshot[tableName], "source")
      : sourceSnapshot[tableName];
    const targetRows = tableName === "books"
      ? normalizeBooksForParity(targetSnapshot[tableName], "target")
      : targetSnapshot[tableName];
    parity[tableName] = {
      sourceRows: sourceRows.length,
      targetRows: targetRows.length,
      sourceDigest: digest(sourceRows),
      targetDigest: digest(targetRows),
      matched: sameRows(sourceRows, targetRows),
    };
    if (!parity[tableName].matched) differences[tableName] = describeDifferences(sourceRows, targetRows);
  }

  const unmatchedTables = Object.entries(parity).filter(([, value]) => !value.matched).map(([name]) => name);
  const invalidRelationships = Object.entries(targetForeignKeys).filter(([, count]) => count !== 0);
  const output = { parity, targetForeignKeys, differences, result: unmatchedTables.length || invalidRelationships.length ? "failed" : "passed" };
  console.log(JSON.stringify(output, null, 2));
  if (unmatchedTables.length || invalidRelationships.length) {
    throw new Error(`Parity verification failed: ${JSON.stringify({ unmatchedTables, invalidRelationships })}`);
  }
} finally {
  await Promise.all([source.end(), target.end()]);
}

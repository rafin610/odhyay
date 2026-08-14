import { readFile } from "node:fs/promises";
import { put } from "@vercel/blob";

const assets = [
  {
    localPath: "/home/ubuntu/webdev-static-assets/odhyay-vercel-migration/ai-for-student-cover.jpg",
    pathname: "covers/migrated/ai-for-student-cover.jpg",
    contentType: "image/jpeg",
  },
  {
    localPath: "/home/ubuntu/webdev-static-assets/odhyay-vercel-migration/ai-for-student.pdf",
    pathname: "books/migrated/ai-for-student.pdf",
    contentType: "application/pdf",
  },
];

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  throw new Error("BLOB_READ_WRITE_TOKEN is required for the one-off migration.");
}

const uploads = [];
for (const asset of assets) {
  const contents = await readFile(asset.localPath);
  const blob = await put(asset.pathname, contents, {
    access: "public",
    addRandomSuffix: false,
    contentType: asset.contentType,
  });
  uploads.push({ pathname: asset.pathname, url: blob.url, size: contents.byteLength });
}

console.log(JSON.stringify({ uploads }, null, 2));

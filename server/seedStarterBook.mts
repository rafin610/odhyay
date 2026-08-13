import { createBook, listBooks } from "./db";

async function seedStarterBook() {
  const existing = await listBooks({ includeDrafts: true });
  if (existing.some((book) => book.slug === "welcome-to-odhyay")) {
    console.log("Starter ODHYAY guide already exists.");
    return;
  }
  const created = await createBook({
    title: "Welcome to ODHYAY",
    authorName: "ODHYAY Editorial",
    categoryName: "Library Guide",
    description: "A short guide to finding books, keeping your place, and making the most of a calm digital library.",
    pageCount: 12,
    status: "published",
  });
  console.log(`Created persisted starter book: ${created.slug}`);
}

seedStarterBook().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

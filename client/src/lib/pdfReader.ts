export function readerPdfUrl(slug: string) {
  return `/api/reader/pdf/${encodeURIComponent(slug)}`;
}

export function readerPdfErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (/404|No PDF/.test(message)) return "No reader document is attached to this book.";
  return "The stored document could not be opened here.";
}

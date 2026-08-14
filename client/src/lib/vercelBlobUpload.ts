export type BlobUploadKind = "cover" | "pdf";

let availability: boolean | undefined;

export async function vercelBlobUploadsEnabled() {
  if (availability !== undefined) return availability;
  try {
    const response = await fetch("/api/admin/uploads/blob", { credentials: "include" });
    const payload = await response.json().catch(() => null) as { enabled?: boolean } | null;
    availability = response.ok && payload?.enabled === true;
  } catch {
    availability = false;
  }
  return availability;
}

# ODHYAY Production-Readiness Audit

**Scope.** This audit covers the current ODHYAY source tree, Vercel deployment model, TiDB/Blob persistence design, Google OAuth integration, public reading journey, administrator workflow boundaries, automated coverage, and direct production dependency audit. It does not replace a penetration test, privacy/legal review, or an operator-led Google account login confirmation.

## 1. System map

| Layer | Technology | Responsibility | Production boundary |
|---|---|---|---|
| Browser application | React 19, Wouter, TanStack Query, tRPC client, Tailwind | Library browsing, search, book detail, reader, admin workspace | Static Vite artifact served from Vercel CDN |
| API function | Express 5, tRPC 11 | Session-aware procedures, Google OAuth routes, uploads, PDF reader delivery | Vercel catch-all function at `/api/*` |
| Persistence | Drizzle ORM, MySQL driver, TiDB Cloud Serverless | Users, authors, categories, books, progress, favorites, bookmarks | TLS-protected `DATABASE_URL`, not embedded in source |
| Media | Vercel Blob | Public cover objects and approved PDF objects | Administrator-only direct-upload authorization |
| Identity | Google OAuth and HS256 cookie sessions | Google login, role lookup, administrator gating | Redirect callback and `JWT_SECRET` held as deployment secrets |

> **Request path.** A visitor receives `index.html` and hashed Vite assets from the CDN. The SPA sends tRPC calls to `/api/trpc/*`; Vercel rewrites those calls to `api/[...path].ts`, which exports the shared Express app. Express creates tRPC context, verifies the session cookie when needed, and queries TiDB. Cover images are read from Blob; PDFs are fetched server-side from an approved Blob URL and delivered through `/api/reader/pdf/:slug` for same-origin PDF.js rendering.

## 2. Deployment and routing findings

| Finding | Severity | Resolution | Evidence |
|---|---:|---|---|
| Express deployment served APIs but returned `Cannot GET /` for the SPA root | High | Reverted to Vite static output plus a dedicated catch-all API function and explicit rewrites | Production root and `library.list` now render/respond |
| Vercel function crashed during module initialization | High | Replaced extensionless local runtime imports and unsupported path aliases with Node ESM-relative `.js` imports; guarded Manus-only storage route | Runtime API smoke test reaches TiDB |
| Vite deployment initially returned platform 404s for `/api/*` | High | Added `/api/(.*)` rewrite to the catch-all function before SPA fallback | Direct production `library.list` response contains migrated catalog data |
| Express 5 upgrade rejected legacy unnamed wildcard patterns | High | Replaced fallback paths with named `/{*splat}` and storage wildcard with `/*path` | Local API smoke test passes; targeted regression coverage added |

The Vercel architecture intentionally keeps the existing Manus deployment online as a rollback route until the final acceptance checks are complete.

## 3. Authentication, authorization, and media controls

| Area | Verified control | Assessment |
|---|---|---|
| Google sign-in | Callback origin is validated and state is bound to the initiating origin before session issuance | Implemented; final visual verification in Google Cloud remains an operator task |
| Session cookie | `HttpOnly`, `Secure` when HTTPS is present, `SameSite=None`, root path | Appropriate for Vercel and Google callback flow; HTTPS is required in production |
| Role access | `adminProcedure` checks the persisted user role, not client state | Administrator CRUD and upload routes are gated server-side |
| Direct Blob upload | Same-origin check, authenticated administrator check, upload-kind allowlist, content type, size limit, folder restriction | Covers and PDFs are constrained to the supported media contracts |
| PDF reader | Published book lookup, approved Vercel Blob URL allowlist, server-side retrieval, same-origin response | Avoids PDF.js cross-origin redirect failures and arbitrary remote PDF retrieval in Vercel |
| Error handling | Final Express error middleware logs the internal error and returns a generic JSON message | Reduces accidental error-detail disclosure |

## 4. Persistence and business-flow reconciliation

The relational model implements the intended vocabulary: `users`, `authors`, `categories`, `books`, `reading_progress`, `favorites`, and `bookmarks`. Foreign-key behavior is relied on for dependent user-reading records when a book is deleted. The earlier source-to-TiDB parity verification reconciled table rows, foreign-key integrity, roles, reading data, and Blob media references.

Public `library.list`, categories, slug lookup, and reader routes draw their content from the database. Administrative creation/edit/delete procedures enforce administrator status, create or reuse author/category records, use Unicode-safe Bengali slugs with collision suffixes, and invalidate the relevant cached public/admin views. Reader progress, favorites, and bookmarks require authentication.

## 5. Code quality and dependency remediation

The audit identified two client render-safety defects and one error-handling gap. Browser-storage synchronization was moved out of render computation, reader theme storage is now guarded for privacy-restricted browsers, and a final Express error boundary was added. Unused template-only chat/chart/showcase code was removed instead of shipping its unused dependency surface.

The production dependency audit initially reported **17 high**, **47 moderate**, and **8 low** findings, largely from unused UI packages and older runtime dependencies. Remediation removed unused packages and upgraded Axios, Nano ID, Drizzle ORM, and Express. The final `pnpm audit --prod --json` exits successfully with **0 critical, 0 high, 0 moderate, and 0 low** findings.

## 6. Automated evidence

| Check | Result |
|---|---:|
| Vitest suite | **32 files, 52 tests passed** |
| TypeScript | `pnpm check` passed |
| Vercel client build | `pnpm build:vercel` passed |
| Production dependency audit | 0 known production vulnerabilities |
| Local public API smoke test | `library.list` returned the persisted catalog |
| Latest Vercel API contract smoke test | `library.list`, `auth.me`, reader PDF, and Blob capability returned `200`; an unauthenticated Blob-token request returned `403` |
| Live Google OAuth repair | Added and saved `https://odhyay.vercel.app/api/auth/google/callback` under the ODHYAY Web client’s authorized redirect URIs; Google sign-in then opened the administrator workspace with the persisted book list |
| Authenticated Blob upload authorization | In the signed-in administrator book form, a temporary JPEG cover selected from local storage completed with the UI state **Cover ready** / **Stored image**; no book record was submitted |
| Browser reader validation | `/read/ai-for-student` rendered page 1 of 7 from the stored PDF in PDF.js, and the signed-in administrator received the **Bookmark saved** confirmation after saving a reader bookmark |

## 7. Residual items and release gate

The current generated entry bundle remains about **625 kB minified** (about **188 kB gzip**), so further manual chunking remains a performance optimization rather than a functional blocker. The PDF worker is intentionally large and loaded as a separate asset. There is no evidence of fabricated reviews or testimonials in this project.

Before declaring the Vercel migration accepted, the following operator-visible checks remain: complete Google login on the Vercel domain, confirm the administrator dashboard with the intended Google identity, verify a real uploaded cover and PDF, open the stored PDF in the reader, and confirm persistence after refresh. Google Cloud’s authorized callback list should also be visually rechecked for `https://odhyay.vercel.app/api/auth/google/callback`.

**Account-coverage limitation.** This release validation used the authorized administrator account because no separate non-administrator Google test account was provided. The public visitor journey, authenticated bookmark persistence, reader flow, and admin authorization route were therefore verified, but a distinct non-admin browser session remains a recommended follow-up test rather than a release blocker.

## References

1. [Vercel — Express](https://vercel.com/docs/frameworks/backend/express)
2. [Vercel — Vite](https://vercel.com/docs/frameworks/frontend/vite)
3. [Vercel — Node.js Runtime](https://vercel.com/docs/functions/runtimes/node-js)
4. [Vercel — Client uploads with Blob](https://vercel.com/docs/vercel-blob/client-upload)

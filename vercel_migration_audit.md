# ODHYAY Vercel Migration Audit

## Current application dependencies

- **Database:** The production application uses Drizzle with the MySQL/TiDB driver. The schema has relational users, authors, categories, books, reading progress, favorites, and bookmarks. A MySQL-compatible external target minimizes schema and query rewrites.
- **Storage:** Book covers and PDFs are saved through Manus Forge APIs and served through `/manus-storage/*`. This is not portable to Vercel and must be replaced by independently configured object storage before a Vercel cutover.
- **Server runtime:** The site runs as one Express process which registers tRPC, Google OAuth, Manus OAuth, cover/PDF uploads, same-origin PDF streaming, and static Vite serving. Vercel requires serverless/API route adaptation rather than a Vite-only import.
- **Authentication:** Google OAuth is provider-standard but the session issuer is currently in a shared Manus SDK. The signed JWT session design can be retained, but remaining Manus OAuth entry routes and environment assumptions must be removed or isolated for Vercel.

## Vercel account audit

- The authenticated Vercel account has an existing `odhyaylibrary` project associated with a separate `rafin610/oddhay` repository and the domain `odhyaylibrarybd.com`.
- That project has no production domain configured in its current overview and is not the same repository as this ODHYAY source (`rafin610/odhyay`). It will not be reused without an explicit compatibility and source review.
- The configured Manus Vercel connector is disabled. The user requested browser-based operation, and the authenticated Vercel browser session is available for read-only inspection and later, confirmed setup actions.

## Migration guardrails

- Preserve the current Manus deployment until an independently tested Vercel deployment is verified.
- Choose a MySQL-compatible database to retain Drizzle’s MySQL schema, foreign keys, and existing server queries.
- Do not create a new cloud database, storage bucket, Vercel project, production deployment, or modify Google OAuth callback settings without a separate confirmation immediately before the action.

## Target Vercel architecture

The selected target keeps the existing relational data model intact. **TiDB Cloud Serverless** will provide a MySQL-compatible `DATABASE_URL` through the Vercel integration, which avoids an unnecessary PostgreSQL schema rewrite. **Vercel Blob** will replace the non-portable Manus storage contract: public immutable blobs will serve library covers and reader PDFs because published ODHYAY content is intentionally public, while the reader continues to use its same-origin route for dependable PDF.js delivery. The application will retain Google OAuth and move session signing to the existing portable JWT mechanism with a Vercel-managed `JWT_SECRET`.

| Concern | Vercel-compatible design | Migration behaviour |
|---|---|---|
| Relational data | TiDB Cloud Serverless, connected to the dedicated project | Preserve MySQL tables, IDs, foreign keys, admin role, slugs, progress, favorites, and bookmarks. |
| Cover images | Public Vercel Blob with direct browser delivery | Copy managed legacy objects and replace stored `/manus-storage/*` paths with immutable Blob URLs. |
| Reader PDFs | Public Vercel Blob with same-origin `/api/reader/pdf/:slug` streaming | Copy legacy PDF bytes, retain PDF metadata, and make the existing reader route resolve Blob-backed documents. |
| Upload limits | Browser-to-Blob direct uploads, authorized by the application | Avoid Vercel Function request-body limits for 8 MB covers and 30 MB PDFs. |
| API server | Express app exported from a Vercel Function under `/api` | Preserve current tRPC and custom API routes without running a persistent listener. |
| Login | Google OAuth callback plus project-specific signed session cookie | Add preview and production callback URLs only after the deployed Vercel domains are known. |

The code migration must avoid sending PDFs through a Vercel Function: serverless request bodies are capped at 4.5 MB, while client-direct Blob uploads bypass that limit. Published content does not need private storage; using one public Blob store makes card images efficient and keeps PDFs readable without exposing any content that is not already available through the existing public reader route. The new project will use an Express export for API routes and Vite’s static output for the SPA, with explicit route rewrites so `/api/*` is never consumed by the client-side fallback. [1] [2] [3] [4]

## Current relational data inventory

The read-only inventory captured immediately before migration contains four users, five authors, five categories, one book, four reading-progress rows, one bookmark, and no favorite rows. These counts will be re-checked after import before the existing Manus deployment is retired.

## Dedicated Vercel project setup status

The approved browser workflow has reached Vercel’s new-project configuration screen for the correct private source repository, `rafin610/odhyay`, on the `main` branch. No deployment, database connection, storage store, or environment variable has been created from that screen yet. The default Vite preset is not sufficient for this full-stack project, so deployment remains intentionally paused until the Express function, API rewrites, external database connection, and Blob-backed upload design have been implemented and reviewed.

## References

[1]: https://docs.pingcap.com/tidbcloud/integrate-tidbcloud-with-vercel/ "Integrate TiDB Cloud with Vercel"
[2]: https://vercel.com/docs/frameworks/backend/express "Express on Vercel"
[3]: https://vercel.com/docs/vercel-blob/client-upload "Client Uploads with Vercel Blob"
[4]: https://vercel.com/kb/guide/how-to-upload-and-store-files-with-vercel "How to upload and store files with Vercel"

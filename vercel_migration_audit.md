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

The approved browser workflow has reached Vercel’s new-project configuration screen for the correct private source repository, `rafin610/odhyay`, on the `main` branch, with Vite selected and the project name `odhyay`. The source was synchronized to GitHub commit `56bc16a87bdd9a8354af8c3ab2df4990649e101d` before the approved initialization step. The user has confirmed initial deployment creation; database connection, storage store, and environment variables are still intentionally absent until the project exists and each secure dependency can be connected to it.

Vercel’s configuration form now exposes the approved **Deploy** control for this dedicated project. The build/output and environment sections are intentionally left untouched at this initialization step because the target database and secret values must be created or entered after project creation.

The approved initial deployment has been submitted as Vercel deployment `dpl_GNSTuYHERaPbJQf1ceTivEtxfNYf` from commit `56bc16a`. Its build status is pending at the time of this record; it is expected to become a configuration-only deployment until external persistence and secrets are attached.

Vercel successfully cloned the private repository and completed dependency installation with the project’s pinned pnpm/TypeScript toolchain. The initial build has entered its transform stage; no deployment result is recorded yet.

The initial deployment completed successfully and Vercel generated the dedicated project URL `https://odhyay-8f5ff3iad-ahmedrafin014-9807s-projects.vercel.app`. The static application shell renders there; data-backed and authenticated flows remain intentionally unverified until database, Blob storage, and secrets are configured.

The approved TiDB integration dialog is open. It requires selection of the `ahmedrafin014-9807's projects` Vercel team and offers all-projects or specific-project access. The migration will select only the dedicated `odhyay` project rather than grant access to existing unrelated projects.

The team and the dedicated `odhyay` project have been selected under the specific-project permission scope. Vercel changed the submit action to **Resume**, indicating an external TiDB authorization handoff. The continuation did not complete automatically in the connected browser session, so account authentication or consent must be completed by the user before provisioning can proceed.

After the user reported completion, the Vercel integration dialog still displayed the same pending **Resume** state. A fresh continuation attempt did not advance the flow, so no TiDB cluster, Vercel `DATABASE_URL`, or import target is available yet.

The available browser is authenticated to TiDB Cloud as Ahmed Rafin in `Ahmed's Org`. The `My TiDB` inventory currently contains no resources, confirming that a new TiDB Serverless resource must be provisioned before data migration can begin.

TiDB Cloud’s resource form initially selected the paid Essential plan. This was changed to the Starter plan, which specifies a $0 monthly spending limit, Tokyo region, no credit card requirement, and automatic throttling if the included free quota is exhausted. The existing relational inventory is small enough for the initial migration to remain within that protected configuration.

The approved migration target is named `odhyay-library-db`; it remains on AWS Tokyo under the free Starter plan with the $0 spending limit. Resource creation is pending the final approved form submission.

The TiDB Starter resource was created successfully with instance ID `10244776892659937403`. Its current status is **Creating**, with zero request units and zero storage usage. The next migration action will wait until the instance becomes active, then retrieve a secure connection URL without exposing its credentials.

The instance became active and the target database `odhyay` was created through TiDB’s SQL Editor. The full table-definition script is loaded and validated for execution; the editor’s initial single-statement run created only the database, so the remaining `USE odhyay` and table statements will be executed together next.

All seven required tables were created successfully in the TiDB `odhyay` database, including their primary keys, unique constraints, indexes, and foreign-key references. The relational import also completed without errors: four user identities (including both administrator roles), five authors, five categories, one published book, four reading-progress records, and one bookmark were preserved with original IDs and timestamps. There are no source favorites to migrate. Legacy managed-storage references are intentionally retained temporarily until the secure Vercel Blob object migration is complete.

The dedicated `odhyay-media` Vercel Blob store has been provisioned in `iad1` with public access, matching the current library's public-cover and public-reader delivery design. It is connected only to the `odhyay` Vercel project in Production and Preview environments. Vercel injected `BLOB_STORE_ID` and `BLOB_WEBHOOK_PUBLIC_KEY`; the current serverless path will require either the resulting OIDC system token or an explicit read-write token to enable uploads. The existing JPEG cover (40 KB) and PDF (637 KB) were retrieved from the current live-compatible environment into local migration staging and verified as `image/jpeg` and `application/pdf` respectively, ready for approved Blob import.

The Vercel dashboard’s manual upload control did not expose a browser-accessible file input, so media migration will use the store’s managed server credential rather than a manual browser upload. The existing project connection currently exposes only `BLOB_STORE_ID` and `BLOB_WEBHOOK_PUBLIC_KEY`; a read-write token must be added or the Vercel OIDC system token confirmed before the staged objects can be inserted through the supported Blob SDK.

Using the store’s managed read-write credential, the staged objects were successfully copied to public Vercel Blob URLs without filename randomization: `covers/migrated/ai-for-student-cover.jpg` (40,553 bytes) and `books/migrated/ai-for-student.pdf` (651,790 bytes). The next data-migration statement will replace only the corresponding TiDB book `coverUrl` and `pdfKey` values with these Blob URLs; original metadata and all relationship IDs remain unchanged.

The TiDB target record for `ai-for-student` now references the migrated Blob cover and PDF URLs, while preserving `pdf.pdf`, `application/pdf`, and the original 651,790-byte size metadata. Direct HTTPS retrieval verifies `200 OK` with `image/jpeg` (40,553 bytes) for the cover and `application/pdf` (651,790 bytes) for the PDF. The relational database and managed media migration are therefore complete and independently retrievable; the next phase is Vercel runtime configuration and end-to-end application validation.

## Source-versus-TiDB integrity verification

On 14 August 2026, the read-only source inventory was compared with the dedicated TiDB target by executing `scripts/verifyTiDbMigration.mjs` against TiDB and querying the source database directly. All expected entity counts match, both administrator identities retained their roles, and the migrated book retains its PDF metadata while pointing to the intended Vercel Blob objects.

| Entity or reference | Source | TiDB target | Result |
|---|---:|---:|---|
| Users | 4 | 4 | Matched |
| Authors | 5 | 5 | Matched |
| Categories | 5 | 5 | Matched |
| Books | 1 | 1 | Matched |
| Reading-progress records | 4 | 4 | Matched |
| Bookmarks | 1 | 1 | Matched |
| Favorites | 0 | 0 | Matched |
| Administrators | `google:100673852661440648928`, `google:115012525577847235158` | Same two identities, both `admin` | Matched |
| Book cover reference | Legacy managed object | Vercel Blob `covers/migrated/ai-for-student-cover.jpg` | Expected replacement, HTTP 200 verified |
| Book PDF reference | Legacy managed object | Vercel Blob `books/migrated/ai-for-student.pdf` | Expected replacement; filename, MIME type, and 651,790-byte size retained |

The migration is integrity-complete at the data and object-reference level. The legacy Manus deployment remains active and unchanged as the rollback path. Vercel runtime, authentication, and browser-flow validation remain required before any production cutover.

### Complete row-level parity outcome

The initial detailed comparison identified only expected or live-operation timestamp drift: the Blob-reference update changed the target book timestamp, while continued activity on the still-live Manus deployment advanced one user session and one reading-progress timestamp. The live session and progress timestamps were synchronized to TiDB through an ID-validated transaction. The book’s `updatedAt` is intentionally normalized only for the parity comparison because its target-side Blob reference is a deliberate replacement of the source’s managed-storage reference; every other book field, including identity, author/category relationships, publication state, and PDF metadata, remains exact.

The final `verifySourceToTiDbParity.mjs` run passed with matching canonical row digests for all seven tables: users, authors, categories, books, reading progress, favorites, and bookmarks. It also validated all eight relationship directions—book-to-author, optional book-to-category, and user/book references for progress, favorites, and bookmarks—with zero orphaned rows. This completes the lossless relational migration proof and preserves the newly migrated immutable Blob paths as the only approved object-reference difference.

## Production configuration progress

The dedicated Vercel project now has encrypted Production-and-Preview entries for the TiDB connection string, a new Vercel-only JWT session-signing secret, Google OAuth client ID and client secret, the Blob write credential, and the administrator identity. Vercel-injected Blob store identifiers remain scoped to Production and Preview. The Google Cloud project’s existing **ODHYAY Web** OAuth client is open for configuration; its Vercel redirect URI will be added next before deployment is triggered. No secret values are recorded in this audit.

The Google Cloud client update was completed successfully, with the operator confirming addition of the Vercel callback and the console showing an “OAuth client saved” notification. The Vercel production origin `https://odhyay.vercel.app` is visibly saved on the existing **ODHYAY Web** OAuth client. A final direct visibility check of `https://odhyay.vercel.app/api/auth/google/callback` under the authorized redirect URI section remains tracked before release validation. The application now routes all legacy sign-in fallbacks to Google and does not register the Manus callback on Vercel; a stable local session application identifier keeps signed Google sessions valid without `VITE_APP_ID`.

## Deployment validation status

The first Vercel-ready source revisions were pushed to the private GitHub `main` branch and did trigger Vercel production deployments. The initial API-function approach produced a module-resolution failure; a root Express entrypoint and a production-safe app-factory split were added and passed local tests and Vercel-mode build checks. Subsequent Vercel deployments were blocked before runtime by the platform message: **“No Output Directory named `public` found after the Build completed.”**

The direct cause was identified in Vercel’s **Build and Deployment** settings: the project had dashboard overrides that continued to use the generic Vite build behavior and expected `dist/public`, bypassing the repository’s Vercel-specific build path. On 15 August 2026, the approved project settings were saved with **Build Command** `pnpm build:vercel` and **Output Directory** `public`, matching the validated project-root artifact generated by the source. A new deployment is required to verify the corrected configuration; until it passes, the canonical `odhyay.vercel.app` release is not approved for cutover and the existing Manus deployment remains the active rollback-safe release.

## Source synchronization and deployment

The private GitHub `main` branch was reconciled with its previously deployed Vercel preparation commit and updated to commit `97f12bb`. The latest Vercel Production deployment was triggered from that commit and reached **Ready** status. The immutable deployment URL is `https://odhyay-emvm8w9wo-ahmedrafin014-9807s-projects.vercel.app/`; it renders the ODHYAY shell successfully. The remaining work is live data, reader, authentication, and administrator-flow validation before the release can be treated as complete.

## References

[1]: https://docs.pingcap.com/tidbcloud/integrate-tidbcloud-with-vercel/ "Integrate TiDB Cloud with Vercel"
[2]: https://vercel.com/docs/frameworks/backend/express "Express on Vercel"
[3]: https://vercel.com/docs/vercel-blob/client-upload "Client Uploads with Vercel Blob"
[4]: https://vercel.com/kb/guide/how-to-upload-and-store-files-with-vercel "How to upload and store files with Vercel"

# ODHYAY

> **A quiet digital library for curious minds.**

ODHYAY is a Bengali-first digital library and online reading platform built for calm discovery and comfortable long-form reading. The product combines a premium editorial interface with a persistent book catalog, Google authentication, an administrator workspace, managed media storage, and a high-quality PDF reading experience.

The design language is **Quiet Editorial**: charcoal and warm ivory in dark mode, warm paper tones in light mode, restrained amethyst accents, generous spacing, and typography that keeps the book—not the interface—at the center.

**Live website:** [odhyay.vercel.app](https://odhyay.vercel.app)

**Managed preview:** [promptweb-mzwhxyal.manus.space](https://promptweb-mzwhxyal.manus.space)

---

## Product overview

ODHYAY lets visitors browse the library, search for books, inspect book details, and explore categories without signing in. Authentication is required when a user opens a book to read. After Google sign-in, the reader returns the user to the requested book and can persist reading progress and bookmarks against the user’s account.

The reading room uses a continuous vertical PDF layout rather than a page-turn carousel. It supports high-DPI canvas rendering, responsive fit-to-width behavior, mobile zoom controls, touch-friendly fullscreen scrolling, automatic resume, debounced progress persistence, reader-specific paper themes, and an auto-hiding minimal toolbar.

Administrators can manage books, authors, categories, covers, PDF files, publication state, and user access from the protected admin workspace.

## Highlights

| Area | Capability |
| --- | --- |
| Discovery | Public library, categories, search, book details, responsive shelves, and editorial landing page |
| Authentication | Google OAuth with persistent sessions and protected reader access |
| Reading | Continuous vertical PDF reader with high-DPI rendering and virtualized page loading |
| Mobile | Fit-to-width reading, visible zoom controls, touch scrolling, fullscreen reading, and horizontal panning when zoomed |
| Persistence | Books, authors, categories, reading progress, bookmarks, favorites, and user roles stored in the database |
| Administration | Protected book management, local cover upload, PDF upload, metadata editing, deletion, and access management |
| Themes | Global dark/light theme plus independent Night, Daylight, and Sepia reader themes |
| Branding | Supplied ODHYAY book-and-bookmark logo used across shared navigation, reader chrome, and branded surfaces |
| Quality | TypeScript checking, Vitest regression coverage, responsive verification, and production builds |

## Reading experience

The reader is deliberately minimal. Its main behaviors are:

1. **Login before reading.** Public browsing remains open, but the PDF reader is not mounted for unauthenticated visitors.
2. **Continuous scroll.** Pages are displayed vertically with comfortable separation instead of requiring next/previous page controls.
3. **Sharp rendering.** PDF.js renders against the device pixel ratio while keeping the canvas CSS size separate from its internal bitmap size.
4. **Virtualization.** Visible pages and nearby neighbors are rendered first; distant pages can be released to keep memory use manageable on long documents.
5. **Automatic resume.** The reader restores the last persisted page and percentage for authenticated users.
6. **Debounced progress.** Meaningful position changes are saved after scrolling settles and are flushed when the reader is left.
7. **Responsive zoom.** Desktop and phone users can zoom out, fit pages to width, or zoom in. A zoomed mobile page can be horizontally panned without disabling vertical reading.
8. **Independent appearance controls.** The global site theme and the reader’s paper appearance are separate preferences.

## Technology stack

| Layer | Technology |
| --- | --- |
| Client | React 19, TypeScript, Vite, Wouter, Tailwind CSS 4 |
| UI | Radix UI primitives, custom ODHYAY components, Lucide icons, Sonner notifications |
| Server | Node.js, Express 5, tRPC 11, SuperJSON |
| Database | TiDB Cloud / MySQL-compatible database through Drizzle ORM and `mysql2` |
| Storage | Vercel Blob in production; managed storage helpers for server-side file access |
| Authentication | Google OAuth, signed session cookies, persistent user records, role-aware authorization |
| Documents | PDF.js (`pdfjs-dist`) with a same-origin PDF delivery endpoint |
| Validation | Zod, TypeScript, Vitest, Testing Library, JSDOM |
| Deployment | Vercel for production, with GitHub-connected deployments |

## Architecture

ODHYAY uses a typed request path from the React client to protected server procedures and persistence helpers:

```text
┌──────────────────────────────────────────────────────────┐
│ React pages and shared UI                                │
│ catalog · details · reader · admin · theme system        │
└──────────────────────────────┬───────────────────────────┘
                               │ tRPC + React Query
┌──────────────────────────────▼───────────────────────────┐
│ Express / tRPC server                                    │
│ public procedures · protected procedures · admin checks   │
└───────────────┬──────────────────────────┬───────────────┘
                │                          │
┌───────────────▼──────────────┐  ┌────────▼───────────────┐
│ Drizzle + TiDB/MySQL         │  │ Managed media storage   │
│ books · users · progress     │  │ covers · original PDFs  │
│ bookmarks · favorites        │  │ Vercel Blob in prod     │
└──────────────────────────────┘  └────────────────────────┘
```

The repository keeps the main application boundaries explicit:

```text
client/
  src/
    components/       Shared shell, reader, UI, and layout components
    contexts/         Global theme context
    pages/            Public, reader, and administrator pages
    lib/              Client helpers such as PDF URLs and reader themes
    _core/hooks/      Authentication hook and client-side framework helpers
    App.tsx           Route definitions and lazy page loading
server/
  _core/              Express, tRPC, OAuth, storage, and runtime plumbing
  db.ts               Drizzle database helpers
  routers.ts          Typed tRPC procedures
  googleOAuth.ts      Google sign-in and callback handling
  pdfReader.ts        Same-origin PDF delivery
  pdfUpload.ts        Managed PDF upload validation and persistence
  storage.ts          Storage abstraction
  vercelBlobUpload.ts Vercel Blob integration
  *.test.ts           Server regression and persistence tests
drizzle/
  schema.ts           Database schema
  migrations/         Generated migration files
shared/
  const.ts            Shared server/client constants
  types.ts            Shared application types
vercel.json            Vercel routing, build, and API function configuration
```

## Getting started

### Prerequisites

Install the following before starting local development:

- Node.js 20 or newer.
- `pnpm` 10 or newer.
- A MySQL-compatible database, such as TiDB Cloud Serverless, for persistent data.
- Google OAuth credentials if local sign-in is required.
- Vercel Blob credentials if local media upload or production storage access is required.

### Install dependencies

```bash
pnpm install
```

### Configure environment variables

Create a local environment file for development. Do not commit it:

```bash
cp .env.example .env
```

If the repository does not contain an `.env.example` in your checkout, create `.env` manually and define the variables required by your selected runtime. The application reads configuration through the server runtime environment; secrets must not be hardcoded in source files.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | TiDB/MySQL connection string used by Drizzle and the server |
| `JWT_SECRET` | Session signing secret |
| `GOOGLE_CLIENT_ID` | Google OAuth client identifier |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `VITE_APP_ID` | Application identity used by the runtime integration |
| `OAUTH_SERVER_URL` | OAuth service base URL used by the runtime |
| `BUILT_IN_FORGE_API_URL` | Server-side managed API base URL when enabled |
| `BUILT_IN_FORGE_API_KEY` | Server-side managed API credential when enabled |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob read/write token for media operations |
| `BLOB_STORE_ID` | Vercel Blob store identifier, when required by the deployment adapter |
| `OWNER_OPEN_ID` | Owner identity used by project-level access checks |
| `PORT` | Optional local/server port; the runtime may supply this automatically |
| `NODE_ENV` | `development` or `production` |

Use the platform’s secret manager for production values. Never place real OAuth, database, session, or storage credentials in GitHub.

### Database setup

Generate and apply the Drizzle migration through the project script:

```bash
pnpm db:push
```

The schema includes users, books, authors, categories, reading progress, bookmarks, favorites, and the relationships required by the application. The production database should be treated as persistent state; review migrations carefully before applying destructive changes.

### Start the development server

```bash
pnpm dev
```

The development server starts the full Express/Vite application. Open the URL printed in the terminal, usually `http://localhost:3000`.

## Development commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the full-stack development server with file watching |
| `pnpm test` | Run the complete Vitest suite |
| `pnpm check` | Run TypeScript without emitting files |
| `pnpm build` | Build the Vite client and bundled production server |
| `pnpm build:vercel` | Build the Vercel-compatible static client output |
| `pnpm start` | Start the bundled production server |
| `pnpm format` | Format repository files with Prettier |
| `pnpm db:push` | Generate and apply Drizzle migrations |

Before opening a pull request, run at least:

```bash
pnpm test && pnpm check && pnpm build
```

## Authentication and authorization

Google sign-in is initiated explicitly by the client and completed by the server callback. Successful authentication creates or updates the persistent user record and establishes a signed session cookie.

The application distinguishes between three access levels:

| Access level | Typical access |
| --- | --- |
| Visitor | Public home, library, categories, search, and book details |
| Authenticated reader | Book reader, reading progress, bookmarks, and favorites |
| Administrator | Book management, uploads, deletion, and user/access management |

Reader access is intentionally protected at the page boundary. A logged-out user sees a sign-in prompt rather than a partially loaded PDF. The OAuth return path is constrained to the same origin and rejects external or API redirect targets.

When adding a protected feature, prefer the existing typed procedure patterns:

```ts
// Server-side pattern
const protectedData = protectedProcedure.query(async ({ ctx }) => {
  // ctx.user is available here
});

// Administrator-only pattern
const adminData = adminProcedure.query(async ({ ctx }) => {
  // ctx.user.role has already been checked
});
```

On the client, use the existing authentication hook and call the login launcher only from an event handler. Do not mint OAuth URLs during render.

## Media and PDF handling

Book covers and PDFs are stored outside the database. The database stores metadata and storage references; file bytes remain in managed object storage. PDFs are served through a same-origin reader endpoint so PDF.js can load them without redirect-CORS failures.

The upload flow validates file type, size, and content signature before persisting metadata. The reader preserves the original PDF binary and performs rendering in the browser. It does not convert uploaded PDFs to JPG or WebP.

For new media features:

1. Store bytes in the managed storage layer.
2. Store only the storage key and relevant metadata in the database.
3. Enforce authorization before accepting uploads or returning protected media.
4. Keep public URLs and signed URLs out of database seed fixtures unless the application explicitly requires them.
5. Test both rejected uploads and successful persistence paths.

## Deployment

The production application is deployed through a GitHub-connected Vercel project. `vercel.json` routes `/api/*` requests to the serverless API function and sends non-API routes to the client application for SPA navigation.

A typical release workflow is:

```bash
git status
git add .
git commit -m "describe the change"
git push origin main
```

Vercel then builds the connected branch using the project configuration. Confirm that the deployment is ready before considering a release complete. After deployment, verify public browsing, Google sign-in, reader access, administrator authorization, media upload, PDF delivery, and persistence flows.

For production Google OAuth, register the exact callback URL for the deployed domain:

```text
https://<your-domain>/api/auth/google/callback
```

The callback origin must match the host serving the request. If a custom domain is introduced, register that domain separately in the Google OAuth client configuration.

## Testing strategy

The test suite covers both pure logic and user-visible behavior. It includes:

- Google identity normalization and OAuth redirect safety.
- Authentication, session continuity, and administrator authorization.
- Book, category, author, progress, bookmark, and favorite persistence.
- PDF upload validation, same-origin delivery, and reader error states.
- Continuous reader rendering, high-DPI sizing, zoom, fullscreen scrolling, resume state, and debounced progress.
- Navigation, branding, theme persistence, contrast, responsive interactions, and admin workflows.

Tests should be deterministic and must not seed arbitrary customer reviews, ratings, testimonials, or other fabricated user-generated content. Persistence tests should clean up temporary records and must not rely on an empty production database.

## Data and security principles

ODHYAY treats the database as persistent application state and object storage as the source of truth for uploaded media bytes. Server procedures—not client visibility alone—enforce access control. Session secrets, Google credentials, database URLs, and storage tokens are environment-managed secrets.

When changing schema or authorization:

1. Update the Drizzle schema and inspect the generated migration.
2. Apply migrations through the approved database workflow.
3. Add or update database helpers.
4. Add typed tRPC procedures with the narrowest appropriate access level.
5. Add tests for allowed and rejected paths.
6. Validate the browser flow and production deployment.

Avoid destructive SQL unless the consequences are understood and a recovery path exists. Do not store file bytes in database columns, expose administrator procedures as public procedures, or trust client-side role checks as authorization.

## Design principles

ODHYAY’s visual system is intentionally restrained:

- **Quiet Editorial:** editorial hierarchy, warm paper surfaces, charcoal depth, and amethyst accents.
- **Reading first:** controls appear when useful and stay visually subordinate to the document.
- **Responsive by default:** mobile reading uses fit-to-width, touch-sized controls, and safe horizontal behavior when zoomed.
- **Accessible interaction:** focus states, semantic labels, readable contrast, and reduced-motion support are part of the component contract.
- **No false social proof:** the product must never fabricate reviews, ratings, or testimonials.

## Contributing

Before proposing a change, describe the user-facing behavior and the affected data or authorization boundary. Keep changes focused, reuse existing shared components, and add regression coverage for every new flow or bug fix.

A useful pull request should explain what changed, why it changed, how it was tested, and whether database migrations, new environment variables, OAuth callback updates, or deployment configuration changes are required.

## License

This repository is licensed under the MIT License. See [`package.json`](./package.json) for the project license declaration.

## References

[1]: https://react.dev/ "React documentation"
[2]: https://www.typescriptlang.org/docs/ "TypeScript documentation"
[3]: https://vite.dev/guide/ "Vite documentation"
[4]: https://trpc.io/docs "tRPC documentation"
[5]: https://orm.drizzle.team/docs/overview "Drizzle ORM documentation"
[6]: https://vercel.com/docs "Vercel documentation"
[7]: https://developers.google.com/identity/protocols/oauth2 "Google OAuth documentation"
[8]: https://mozilla.github.io/pdf.js/ "PDF.js documentation"

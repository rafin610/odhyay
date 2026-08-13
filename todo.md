# ODHYAY persistence work

- [x] Upgrade the static project to the supported full-stack template.
- [x] Define persistent tables for books, authors, categories, reading progress, favorites, and bookmarks.
- [x] Generate and apply the database migration without inserting test data.
- [x] Add typed server procedures for public book browsing and admin book management.
- [x] Replace public-page demo data with persisted queries and loading/error states.
- [x] Connect the admin book list and add-book form to persistent mutations.
- [x] Resolve the full-stack upgrade merge path and retain ODHYAY routing.
- [x] Restart and verify the upgraded full-stack development service.
- [x] Run TypeScript, production build, and persistence-flow verification.
- [x] Add a starter ODHYAY guide record through the persistence layer and verify it appears across public and admin queries.
- [ ] Verify authenticated reader progress or bookmark persistence, or document the browser-auth verification dependency.
- [x] Prevent empty book slugs from triggering validated library-detail queries.
- [x] Prevent unauthenticated public visits from invoking administrator-only book queries.
- [x] Verify the starter book through the authenticated administrator query path.

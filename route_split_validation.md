# Route split validation

The production build after route-level lazy loading emitted the public entry bundle at `624.66 kB` minified (`188.48 kB` gzip), down from the earlier approximately `1.26 MB` reader-inclusive initial bundle. The reader module, including PDF.js, is now emitted separately as `OdhyayPersistent-CoONtWoj.js` (`489.43 kB` minified), while the administrator workspace is emitted as its own `118.93 kB` chunk.

The authenticated browser was used to navigate to `/` after the refactor. The home route resolved successfully and, after its data queries completed, showed the persisted **Welcome to ODHYAY** starter book and **Library Guide** category.

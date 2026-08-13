# PDF QA verification record

On 2026-08-13, an administrator uploaded a generated two-page PDF fixture through the ODHYAY administrator book form. The upload returned the managed key `books/90001/52a7b603-47e8-4336-8f35-7562a6708d2a-odhyay-pdf-qa_3b8d4391.pdf` and persisted the following fields on the temporary `Temporary PDF QA Book` record: filename `odhyay-pdf-qa.pdf`, MIME type `application/pdf`, and size `2221` bytes.

The initial direct managed-storage redirect was incompatible with PDF.js because the worker fetch crossed to the signed storage host. The reader was updated to fetch bytes through the same-origin `/api/reader/pdf/:slug` route. After this change, the reader rendered both fixture pages: page 1 of 2 and page 2 of 2. Reader progress advanced from 50% to 100% when navigating to the second page.

The signed-in administrator advanced to page 2 and saved a bookmark. The resulting persistence record showed `currentPage = 2`, `progressPercentage = 100`, and `bookmarkPage = 2`. The temporary book was then deleted through the administrator confirmation flow; its dependent progress and bookmark rows were removed by the established foreign-key cascades. The now-unreferenced managed test object is intentionally retained only as unreachable storage content, consistent with the storage service lifecycle.

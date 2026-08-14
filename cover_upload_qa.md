# Local cover upload QA notes

- Date: 2026-08-13
- Scope: approved temporary administrator cover-image upload verification using `/home/ubuntu/odhyay-cover-upload-qa.png`.
- Preview administrator session: authenticated as Ahmed Rafin.
- Form: `/admin/books/new` shows **Book cover** with a local JPEG/PNG/WebP chooser and no manual cover URL field.
- Temporary record metadata: title `Temporary Cover Upload QA`, author `ODHYAY QA`, category `Cover QA`.
- Planned cleanup: delete the temporary book and its now-orphaned temporary author/category after validation; the managed object is expected to remain inaccessible once unreferenced.
- Upload result: the local PNG was accepted through the administrator control, stored successfully, and displayed immediately as a selected cover preview with replacement and removal controls.
- Persistence result: the temporary book was created and is available at `/book/temporary-cover-upload-qa`.
- Current issue: the public book-detail page shows the expected cover area but not the uploaded PNG, so managed image delivery needs diagnosis before this QA record is cleaned up.
- Delivery diagnosis: the managed cover URL returned a signed storage redirect and `image/png` content successfully. The initial detail screenshot occurred before the image finished loading; the subsequent detail view rendered the expected QA cover.
- Public verification: the temporary book was included in the public library query and its managed cover rendered successfully on the public book-detail page.
- Cleanup: the temporary book was deleted through the administrator confirmation flow, and the now-unreferenced `ODHYAY QA` author and `Cover QA` category were removed. The managed image is intentionally unreferenced.

## Second-pass rendered-image evidence (in progress)

- Date: 2026-08-13
- Approval: the administrator approved a new temporary upload/create/delete flow specifically to capture direct visual evidence on both public surfaces.
- Administrator session: authenticated as Ahmed Rafin on the preview domain.
- Temporary record setup: `Visual Cover Render QA` by `ODHYAY Visual QA`, in `Visual Cover QA`, with one page and an explicitly temporary QA description.
- Form confirmation: `/admin/books/new` exposed the local JPEG/PNG/WebP cover chooser and no manual cover-URL field.
- Upload evidence: the first candidate exposed a deliberate MIME/signature mismatch because its `.jpg` extension contained PNG bytes; a verified PNG fixture was then accepted. The administrator form displayed the stored-image thumbnail with replacement and removal controls and a successful secure-storage notification.

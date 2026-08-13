# Google OAuth setup status

- Google Auth Platform consent configuration was created for **ODHYAY** in the selected Google Cloud project.
- The consent audience is **External**; Google may require publication or verification before unrestricted production use.
- A web OAuth client named **ODHYAY Web** is being configured.
- The planned development callback is `https://3000-i99hd86gg82sx0jkvaczi-6e8f8aec.us4.manus.computer/api/auth/google/callback`.
- A production deployment or custom domain will require its own exact authorized redirect URI before Google sign-in can work on that origin.

## Published-domain callback requirement

On 2026-08-13, live sign-in on `https://promptweb-mzwhxyal.manus.space` was tested and Google returned `Error 400: redirect_uri_mismatch`. The published ODHYAY origin is correctly requesting the callback below, but it has not yet been added to the **ODHYAY Web** OAuth client’s authorized redirect URIs in Google Cloud:

`https://promptweb-mzwhxyal.manus.space/api/auth/google/callback`

The existing preview callback must remain registered alongside this published callback. After adding the URI, the consent audience should be published when unrestricted public Google sign-in is desired.

The published callback was added to the enabled **ODHYAY Web** client while retaining the preview URI. A subsequent live sign-in reached Google’s account selector without an OAuth error, completed the callback, and returned to the published home page as **Sign out Ahmed**. The same session then opened `/admin/access` on the published domain and retained the `admin` role.

## Existing Google-linked account repair

`server/fixGoogleUsers.mts` backfills a safe display name and the `google` provider value for historical Google-linked rows with incomplete metadata. It deliberately cannot invent or retrieve a missing email address: ODHYAY does not retain Google access tokens, and email must only come from Google’s authenticated user-info response. When an affected reader signs in with Google again, the callback securely retrieves their current approved profile fields and persists the email, name, and provider metadata.

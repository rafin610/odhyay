# Google OAuth setup status

- Google Auth Platform consent configuration was created for **ODHYAY** in the selected Google Cloud project.
- The consent audience is **External**; Google may require publication or verification before unrestricted production use.
- A web OAuth client named **ODHYAY Web** is being configured.
- The planned development callback is `https://3000-i99hd86gg82sx0jkvaczi-6e8f8aec.us4.manus.computer/api/auth/google/callback`.
- A production deployment or custom domain will require its own exact authorized redirect URI before Google sign-in can work on that origin.

## Existing Google-linked account repair

`server/fixGoogleUsers.mts` backfills a safe display name and the `google` provider value for historical Google-linked rows with incomplete metadata. It deliberately cannot invent or retrieve a missing email address: ODHYAY does not retain Google access tokens, and email must only come from Google’s authenticated user-info response. When an affected reader signs in with Google again, the callback securely retrieves their current approved profile fields and persists the email, name, and provider metadata.

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/** Start Google OAuth at the moment a visitor explicitly selects the provider. */
export const startGoogleLogin = () => {
  const url = new URL("/api/auth/google", window.location.origin);
  url.searchParams.set("origin", window.location.origin);
  window.location.href = url.toString();
};

/** Legacy callers use the same Google-first sign-in flow on all ODHYAY hosts. */
export const startLogin = startGoogleLogin;

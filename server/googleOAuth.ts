import { randomBytes, timingSafeEqual } from "crypto";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";

const GOOGLE_STATE_COOKIE = "__Host-google_oauth_state";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

type GoogleState = { nonce: string; redirectUri: string };
type GoogleToken = { access_token?: string; error?: string; error_description?: string };
type GoogleProfile = { sub?: string; email?: string; name?: string };

function requestHost(req: Request) {
  const forwarded = req.headers["x-forwarded-host"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded ?? req.get("host") ?? "";
  return raw.split(",")[0].trim();
}

export function validatedGoogleOrigin(origin: string | undefined, expectedHost: string) {
  if (!origin || !expectedHost) return null;
  try {
    const parsed = new URL(origin);
    const isLocal = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    if (parsed.origin !== origin || parsed.host !== expectedHost) return null;
    if (parsed.protocol !== "https:" && !isLocal) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

function encodeState(value: GoogleState) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function decodeState(value: string | undefined): GoogleState | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<GoogleState>;
    return typeof parsed.nonce === "string" && typeof parsed.redirectUri === "string" ? { nonce: parsed.nonce, redirectUri: parsed.redirectUri } : null;
  } catch {
    return null;
  }
}

function constantTimeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function clearGoogleState(res: Response, req: Request) {
  res.clearCookie(GOOGLE_STATE_COOKIE, getSessionCookieOptions(req));
}

export function registerGoogleOAuthRoutes(app: Express) {
  app.get("/api/auth/google", (req, res) => {
    if (!ENV.googleClientId || !ENV.googleClientSecret) {
      res.status(503).json({ error: "Google sign-in is not configured." });
      return;
    }
    const origin = validatedGoogleOrigin(typeof req.query.origin === "string" ? req.query.origin : undefined, requestHost(req));
    if (!origin) {
      res.status(400).json({ error: "Invalid sign-in origin." });
      return;
    }
    const redirectUri = `${origin}/api/auth/google/callback`;
    const nonce = randomBytes(32).toString("base64url");
    res.cookie(GOOGLE_STATE_COOKIE, encodeState({ nonce, redirectUri }), { ...getSessionCookieOptions(req), httpOnly: true, maxAge: 10 * 60 * 1000 });

    const authUrl = new URL(GOOGLE_AUTH_URL);
    authUrl.searchParams.set("client_id", ENV.googleClientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "openid email profile");
    authUrl.searchParams.set("state", nonce);
    authUrl.searchParams.set("prompt", "select_account");
    res.redirect(302, authUrl.toString());
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    const code = typeof req.query.code === "string" ? req.query.code : undefined;
    const state = typeof req.query.state === "string" ? req.query.state : undefined;
    const saved = decodeState(parseCookieHeader(req.headers.cookie ?? "")[GOOGLE_STATE_COOKIE]);
    clearGoogleState(res, req);
    if (!code || !state || !saved || !constantTimeEqual(state, saved.nonce)) {
      res.status(403).send("Invalid Google sign-in state. Please try again.");
      return;
    }

    try {
      const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: ENV.googleClientId,
          client_secret: ENV.googleClientSecret,
          redirect_uri: saved.redirectUri,
          grant_type: "authorization_code",
        }),
      });
      const token = await tokenResponse.json() as GoogleToken;
      if (!tokenResponse.ok || !token.access_token) throw new Error(token.error ?? "Google token exchange failed");

      const profileResponse = await fetch(GOOGLE_USERINFO_URL, { headers: { Authorization: `Bearer ${token.access_token}` } });
      const profile = await profileResponse.json() as GoogleProfile;
      if (!profileResponse.ok || !profile.sub) throw new Error("Google profile is missing a subject identifier");

      const openId = `google:${profile.sub}`;
      await db.upsertUser({ openId, name: profile.name ?? null, email: profile.email ?? null, loginMethod: "google", lastSignedIn: new Date() });
      const sessionToken = await sdk.createSessionToken(openId, { name: profile.name ?? profile.email ?? "Google reader", expiresInMs: ONE_YEAR_MS });
      res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[Google OAuth] Callback failed", error);
      res.status(500).send("Google sign-in could not be completed. Please try again.");
    }
  });
}

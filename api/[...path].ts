import { createApp } from "../server/app.js";

// Keep the full Express/tRPC application behind Vercel's conventional API
// function route while the Vite artifact is served directly from the CDN.
const app = createApp();

export default app;

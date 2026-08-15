import express from "express";
import { createApp } from "./server/app.js";

// Vercel detects this root Express entrypoint and traces the complete server
// dependency graph into one Node.js function. The app factory keeps local
// development and serverless registration behavior shared and consistent.
const app: express.Express = createApp();

export default app;

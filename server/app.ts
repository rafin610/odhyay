import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerGoogleOAuthRoutes } from "./googleOAuth.js";
import { registerCoverUploadRoute } from "./coverUpload.js";
import { registerPdfUploadRoute } from "./pdfUpload.js";
import { registerReaderPdfRoute } from "./pdfReader.js";
import { registerVercelBlobUploadRoute } from "./vercelBlobUpload.js";
import { registerOAuthRoutes } from "./_core/oauth.js";
import { registerStorageProxy } from "./_core/storageProxy.js";
import { appRouter } from "./routers.js";
import { createContext } from "./_core/context.js";

export function createApp() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  if (!process.env.VERCEL) registerStorageProxy(app);
  if (!process.env.VERCEL) registerOAuthRoutes(app);
  registerGoogleOAuthRoutes(app);
  registerCoverUploadRoute(app);
  registerPdfUploadRoute(app);
  registerReaderPdfRoute(app);
  registerVercelBlobUploadRoute(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );
  return app;
}

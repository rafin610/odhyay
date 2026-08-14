import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerGoogleOAuthRoutes } from "./googleOAuth";
import { registerCoverUploadRoute } from "./coverUpload";
import { registerPdfUploadRoute } from "./pdfUpload";
import { registerReaderPdfRoute } from "./pdfReader";
import { registerVercelBlobUploadRoute } from "./vercelBlobUpload";
import { registerOAuthRoutes } from "./_core/oauth";
import { registerStorageProxy } from "./_core/storageProxy";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";

export function createApp() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
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

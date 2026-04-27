import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { gameApiHandler } from "./game-language-model/router";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // 中文注释：把小游戏 API handler 挂在静态资源之前，避免被 SPA fallback 拦截
  app.use((req, res, next) => {
    if (req.url?.startsWith("/api/")) {
      gameApiHandler(req, res, next);
      return;
    }
    next();
  });

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);

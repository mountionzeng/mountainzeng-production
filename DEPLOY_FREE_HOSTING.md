# 免费部署迁移指南（替代 Railway）

这套站点可以按“纯前端静态站”部署，后端 `server/index.ts` 只用于本地/Node 托管静态文件，不是必须依赖。

## 推荐方案

优先推荐：**Cloudflare Pages（免费）**

原因：
- 对静态站部署简单，支持 GitHub 自动发布
- 免费额度够个人作品集长期使用
- 你的视频和图片已经放在 OSS CDN，站点本体体积小，适合免费方案

## 已经为你做好的工程配置

- 新增静态构建命令：`npm run build:static`（只构建前端）
- 新增 `client/public/_redirects`（SPA 路由回退到 `index.html`）
- 新增 `netlify.toml`（可直接用于 Netlify）
- 新增 `vercel.json`（可直接用于 Vercel）

## Cloudflare Pages 迁移步骤

1. 登录 Cloudflare Dashboard -> `Workers & Pages` -> `Create` -> `Pages`  
2. 连接你的 GitHub 仓库：`mountainzeng-production`
3. 构建配置填写：
   - Framework preset: `Vite`
   - Build command: `npm run build:static`
   - Build output directory: `dist/public`
4. Environment variables（至少配置）：
   - `VITE_VISUAL_MEDIA_CDN_BASE_URL`
   - `VITE_FRONTEND_FORGE_API_URL`（如果你地图在用）
   - `VITE_FRONTEND_FORGE_API_KEY`（如果你地图在用）
   - `VITE_OAUTH_PORTAL_URL` / `VITE_APP_ID`（若你确实启用了 OAuth）
5. 点击 Deploy。

## 大文件（图片/视频）怎么处理

不要把大量视频直接放到静态站仓库中。  
继续保持现在模式：**站点部署在免费平台，媒体走 OSS CDN**。

当前代码读取规则：
- 图片：`${VITE_VISUAL_MEDIA_CDN_BASE_URL}/images/imageN.jpg`
- 视频：`${VITE_VISUAL_MEDIA_CDN_BASE_URL}/mediaN.mov`
- 视频封面：`${VITE_VISUAL_MEDIA_CDN_BASE_URL}/posters/mediaN.jpg`

这样首屏和构建都会更轻，免费额度更稳。

## 备选平台（同样可用）

- Netlify：直接读取 `netlify.toml`
- Vercel：直接读取 `vercel.json`

两者都使用：
- Build command: `npm run build:static`
- Output: `dist/public`

## 验证命令（本地）

```bash
npm run build:static
npm run preview
```

如果本地预览正常，迁移后线上基本可一致。

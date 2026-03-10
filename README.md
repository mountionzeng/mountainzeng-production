# Mountain Zeng — 个人网站

> 一个以 3D 骰子为交互核心的个人作品集网站，六面骰子对应六个维度：视觉、产品、算法、系统、学术跨界、无限可能。

**线上地址：** https://mountainzeng-production.up.railway.app

---

## 技术栈

| 层级 | 技术 |
|---|---|
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite 7 |
| 样式 | Tailwind CSS 4 |
| 动画 | Framer Motion |
| UI 组件 | Radix UI + shadcn/ui |
| 后端 | Express（仅负责静态文件托管） |
| 部署 | Railway（连接 GitHub 自动部署） |
| 包管理 | pnpm |

---

## 项目结构

```
├── client/src/
│   ├── lib/
│   │   ├── diceData.ts          ⭐ 核心数据文件（所有文案都在这里）
│   │   ├── visualPortfolio.ts   视觉作品集 CDN 配置
│   │   ├── diceEngine.ts        骰子旋转动画逻辑
│   │   └── utils.ts             工具函数
│   ├── components/
│   │   ├── Dice3D.tsx           3D 骰子组件
│   │   ├── DimensionPanel.tsx   点击骰子后展开的详情面板
│   │   └── ParticleField.tsx    背景粒子效果
│   ├── pages/
│   │   └── Home.tsx             首页（主布局）
│   └── index.css                全局样式 & 字体
├── server/
│   └── index.ts                 Express 服务器（生产环境托管静态文件）
├── public/
│   ├── Mountion.png             首页手写字 Logo
│   └── fonts/                   自定义字体
└── package.json                 项目配置 & 启动脚本
```

---

## 如何修改网站内容

**所有文案和内容都集中在一个文件：**

```
client/src/lib/diceData.ts
```

打开这个文件，找到对应的维度（01 视觉 / 02 产品 / 03 算法 / 04 系统 / 05 学术跨界 / 06 无限可能），直接修改即可。

### 字段说明

每个维度的数据结构如下：

```typescript
{
  // ── 基础信息 ──────────────────────────────────
  title: "视觉",                    // 中文标题
  tabLabel: "Visual",              // 首页 Tab 英文标签
  subtitle: "VISUAL",              // 详情页英文副标题
  color: "#4A7BF7",                // 主题色（影响所有高亮颜色）
  icon: "Palette",                 // 图标（Lucide 图标名或 emoji）

  // ── 首页展示 ──────────────────────────────────
  homeDescription: "...",          // 首页卡片文案（重点修改这里）
  skills: ["技能1", "技能2"],       // 首页技能标签
  buttonText: "进入详情",           // 首页按钮文字

  // ── 详情页展示 ────────────────────────────────
  description: "...",              // 详情页主描述
  quote: "...",                    // 详情页引言
  coreStatement: "...",            // 详情页核心定位语
  works: [...],                    // 作品/项目卡片列表
}
```

### 修改示例

想改「视觉」维度的首页文案：

1. 打开 `client/src/lib/diceData.ts`
2. 找到 `// ── 01 视觉` 注释下方的数据块
3. 修改 `homeDescription` 字段的内容
4. 保存文件，提交并推送到 GitHub，Railway 会自动部署

---

## 本地开发

```bash
# 1. 安装依赖
pnpm install

# 2. 启动开发服务器（支持热更新）
pnpm dev

# 3. 浏览器访问
# http://localhost:3000
```

---

## 构建与部署

```bash
# 构建生产版本
pnpm build

# 本地预览生产版本
pnpm start
```

**自动部署：** 只要将代码推送到 GitHub 的 `main` 分支，Railway 会自动触发构建和部署，无需手动操作。

### Railway 一键重部署

```bash
# 首次使用先登录 Railway
NPM_CONFIG_CACHE=/tmp/.npm-cache npx -y @railway/cli login

# 查看当前服务部署状态
pnpm railway:status

# 一键触发重部署
pnpm railway:redeploy
```

---

## 视觉作品集配置

视觉维度的图片和视频托管在阿里云 OSS，配置文件在：

```
client/src/lib/visualPortfolio.ts
```

CDN 基础地址：`https://mountion.oss-cn-beijing.aliyuncs.com/visual`

---

## 字体

| 字体 | 用途 | 文件 |
|---|---|---|
| Voyage Regular | 首页手写风格标题 | `public/fonts/Voyage-Regular.otf` |
| TW Sung | 中文宋体 | `public/fonts/TW-Sung.ttf` |

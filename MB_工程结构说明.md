# 工程结构

> 项目：`mountainzeng-production`  
> 目标：解释本地程序目录里“每个主要文件/目录大概做什么”，方便你后续自己改内容、改样式、查问题。

## 1. 系统是怎么跑起来的

1. 浏览器请求页面。
2. `server/index.ts` 用 Express 提供静态资源（`dist/public`）。
3. 前端入口 `client/src/main.tsx` 挂载 React。
4. `client/src/App.tsx` 做路由分发（首页/404）。
5. `client/src/pages/Home.tsx` 渲染首页与骰子交互，展开 `DimensionPanel` 显示分支页内容。
6. 分支页内容主要来自 `client/src/lib/diceData.ts`（文案和结构数据）。

---

## 2. 根目录结构与作用

### `client/`

前端工程主目录（React + Vite + Tailwind）。

### `server/`

后端入口（轻量 Express），主要负责生产环境托管静态页面。

### `shared/`

前后端共享常量（当前体量较小）。

### `public/`

静态资源目录（会原样拷贝到构建产物）。

### `dist/`

构建输出目录（打包产物），部署最终使用这里。

### `scripts/`

自动化脚本（例如 Railway 一键重部署）。

### `skills/`

本地辅助技能文档（偏开发流程工具，不是线上业务逻辑）。

---

## 3. 关键文件职责（按优先级）

### `[client/src/lib/diceData.ts](/Users/yuandai/Documents/New project/mountainzeng-production/client/src/lib/diceData.ts)`

核心内容数据源。  
六个分支页面的标题、文案、模块数据基本都在这里。  
你改页面内容时，**优先改这个文件**。

### `[client/src/pages/Home.tsx](/Users/yuandai/Documents/New project/mountainzeng-production/client/src/pages/Home.tsx)`

首页主布局与交互编排：  

- 标题区  
- 标签栏  
- 骰子入口  
- 打开分支页面板逻辑

### `[client/src/components/DimensionPanel.tsx](/Users/yuandai/Documents/New project/mountainzeng-production/client/src/components/DimensionPanel.tsx)`

分支页总容器。  
视觉/产品/算法/系统/跨界/未来的具体模块大多在这里渲染。  
你这次说的“系统能力体系 UI”就在这个文件里。

### `[client/src/components/Dice3D.tsx](/Users/yuandai/Documents/New project/mountainzeng-production/client/src/components/Dice3D.tsx)`

3D 骰子组件，负责旋转、切面、动画交互等表现。

### `[client/src/lib/diceEngine.ts](/Users/yuandai/Documents/New project/mountainzeng-production/client/src/lib/diceEngine.ts)`

骰子旋转计算逻辑（纯函数层）。  
动画行为策略和目标朝向计算放这里更好维护。

### `[client/src/lib/visualPortfolio.ts](/Users/yuandai/Documents/New project/mountainzeng-production/client/src/lib/visualPortfolio.ts)`

视觉分支媒体资源映射与 URL 构建。  
CDN 基础地址、图片/视频清单与地址拼接在这里。

### `[client/src/index.css](/Users/yuandai/Documents/New project/mountainzeng-production/client/src/index.css)`

全局样式入口。  
包括字体声明、基础排版、全局变量和分支页可读性规则。

### `[client/src/main.tsx](/Users/yuandai/Documents/New project/mountainzeng-production/client/src/main.tsx)`

前端启动入口，仅负责挂载 React 根组件与全局样式引入。

### `[client/src/App.tsx](/Users/yuandai/Documents/New project/mountainzeng-production/client/src/App.tsx)`

应用级壳层：主题、错误边界、路由（`/`、`/404`）。

### `[server/index.ts](/Users/yuandai/Documents/New project/mountainzeng-production/server/index.ts)`

生产服务入口：  

- `express.static` 提供静态文件  
- 所有路由回落到 `index.html`（支持前端路由）

### `[vite.config.ts](/Users/yuandai/Documents/New project/mountainzeng-production/vite.config.ts)`

Vite 构建和开发配置：  

- `root` 指向 `client`  
- `build.outDir` 指向 `dist/public`  
- 插件、别名、开发服务器配置都在这里。

### `[package.json](/Users/yuandai/Documents/New project/mountainzeng-production/package.json)`

项目脚本和依赖入口。  
常用命令：

- `npm run dev`：本地开发
- `npm run build`：构建
- `npm run start`：运行构建产物
- `npm run railway:redeploy`：触发线上重部署

### `[railway.toml](/Users/yuandai/Documents/New project/mountainzeng-production/railway.toml)`

Railway 部署配置（构建命令、启动命令、健康检查等）。

### `[.env.example](/Users/yuandai/Documents/New project/mountainzeng-production/.env.example)`

环境变量模板。  
用于说明哪些变量需要在本地或部署平台配置。

### `[scripts/railway-redeploy.sh](/Users/yuandai/Documents/New project/mountainzeng-production/scripts/railway-redeploy.sh)`

重部署脚本封装。  
内部调用 Railway CLI 触发服务 redeploy。

### `[public/](/Users/yuandai/Documents/New project/mountainzeng-production/public)`

静态资源（字体、媒体、图片等）源目录，构建时会被复制。

### `[dist/public/](/Users/yuandai/Documents/New project/mountainzeng-production/dist/public)`

前端打包结果（JS/CSS 哈希文件、index.html）。  
线上看到的版本就是这里的产物。

### `[pnpm-lock.yaml](/Users/yuandai/Documents/New project/mountainzeng-production/pnpm-lock.yaml)`

依赖锁文件。  
确保本地/线上安装到同一依赖版本，减少“我本地好好的”问题。

---

## 4. 你日常最常改的 3 个点

1. 内容文案：`[client/src/lib/diceData.ts](/Users/yuandai/Documents/New project/mountainzeng-production/client/src/lib/diceData.ts)`
2. 分支页 UI：`[client/src/components/DimensionPanel.tsx](/Users/yuandai/Documents/New project/mountainzeng-production/client/src/components/DimensionPanel.tsx)`
3. 首页布局：`[client/src/pages/Home.tsx](/Users/yuandai/Documents/New project/mountainzeng-production/client/src/pages/Home.tsx)`

---

## 5. 哪些目录通常不要手动改

1. `dist/`：构建产物，通常由 `build` 自动生成。
2. `node_modules/`：依赖安装目录。
3. `.git/`：版本库内部数据。

---

## 6. 快速自检命令（本地）

```bash
cd "/Users/yuandai/Documents/New project/mountainzeng-production"
npm run build
npm run dev -- --port 4010
```

打开：`http://localhost:4010/`

---

## 7. 核心文件“内部结构”详细拆解

### `[client/src/main.tsx](/Users/yuandai/Documents/New project/mountainzeng-production/client/src/main.tsx)`

内部结构非常简单，只有三步：

1. 引入 `App` 和全局样式 `index.css`。
2. `createRoot(document.getElementById("root"))`。
3. `render(<App />)` 挂载 React 应用。

你一般不会改这个文件，除非要接入全局 Provider（如埋点、国际化）。

### `[client/src/App.tsx](/Users/yuandai/Documents/New project/mountainzeng-production/client/src/App.tsx)`

内部结构分两层：

1. `Router()`：用 `wouter` 的 `Switch/Route` 做路由分发（`/`、`/404`、fallback）。
2. `App()`：应用外层壳，按顺序包裹：

- `ErrorBoundary`
- `ThemeProvider`
- `TooltipProvider`
- `Toaster`
- `Router`

你要改全局能力（主题、全局弹窗、错误兜底），就在这里改。

### `[client/src/pages/Home.tsx](/Users/yuandai/Documents/New project/mountainzeng-production/client/src/pages/Home.tsx)`

内部结构可按 8 个区域理解：

1. **顶部调参常量区**：`HOME_*_TUNING`、`HOME_STAGE_SIZE`。
2. **本地 icon 小组件**：`WechatIcon`。
3. **状态区**：首页交互状态（`activeTab`、`isRolling`、`showDimension` 等）。
4. **工具函数区**：Toast 定位、复制剪贴板、颜色计算。
5. **副作用区（useEffect）**：

- Toast 清理/跟随鼠标
- 首页比例缩放同步（`visualViewport.scale` 参与计算）

1. **事件处理区**：

- 骰子滚动开始/结束
- 分支页面打开/关闭
- 标签切换触发骰子联动

1. **渲染区：背景与主舞台**：

- 粒子背景 + 渐变叠层
- 标题图与右侧社交按钮
- 标签栏 + 文案卡片
- 骰子组件 `Dice3D`

1. **渲染区：浮层**：

- Toast 浮层
- `DimensionPanel` 分支页浮层

你改首页排版，优先看：常量区 + 渲染区（标题、标签卡片、骰子容器）。

### `[client/src/components/Dice3D.tsx](/Users/yuandai/Documents/New project/mountainzeng-production/client/src/components/Dice3D.tsx)`

内部结构分为“状态机 + 渲染”两部分：

1. **类型和常量**：

- `Dice3DProps`
- `SpinState`
- `IDLE_RESUME_DELAY_MS` 等

1. **状态与引用**：

- 当前旋转角 `rotation`
- 动画时长 `spinDurationMs`
- 多个 `ref` 管理滚动队列、超时、当前 spin

1. **核心流程函数**：

- `startSpin(faceId, mode)`：开始一次旋转
- `finishSpin(spinId)`：结束并触发回调
- `requestTargetSpin(faceId)`：处理标签触发的目标旋转
- `roll()`：处理随机掷骰子

1. **副作用**：

- idle 漂浮动画循环
- targetFace 变化触发旋转
- 组件卸载清理

1. **渲染**：

- 3D 场景容器
- 光晕/阴影
- 骰子六个面内容与图标

你改“骰子速度、停面逻辑、卡住问题”，主要改第 3 部分。

### `[client/src/lib/diceEngine.ts](/Users/yuandai/Documents/New project/mountainzeng-production/client/src/lib/diceEngine.ts)`

这是纯函数模块，结构清晰：

1. 类型：`SpinMode`、`DiceRotation`、`SpinConfig`
2. 常量：

- `FACE_ROTATIONS`（每个面的目标角）
- `SPIN_CONFIG`（快慢时长、速度倍率、额外圈数）

1. 函数：

- `getSpinDurationMs`
- `getSpinSpeedMultiplier`
- `randomFaceId`
- `buildSpinRotation`（核心：保证最终稳定停在目标面）

这个文件只做计算，不做 UI，适合单测。

### `[client/src/components/DimensionPanel.tsx](/Users/yuandai/Documents/New project/mountainzeng-production/client/src/components/DimensionPanel.tsx)`

这是最大文件，建议按“模块群”理解：

1. **基础区**：

- props/interface
- 常量（分页、布局、动画 easing、最大宽度）
- Paper Spotlight 初始数据

1. **通用展示组件群**：

- `WorkCard`
- `StatsGrid`
- `Timeline`
- `SectionTitle`
- `NextDimensionNav`

1. **系统页组件群**：

- `ProgrammingLanguageCapability`
- `parseSystemAbilityTree`
- `SystemAbilityTree`
- `SystemTrainingBlock`
- `SystemCapabilityCards`
- `SystemApplicationList`

1. **算法页组件群**：

- `KnowledgeChain`
- `AlgorithmCourseDetails`
- `AlgorithmApplicationAreas`
- `AlgorithmProjects`

1. **跨界/未来页组件群**：

- `EducationTimeline`
- `HybridAdvantages`
- `FutureDirections`

1. **Paper Spotlight 解析与渲染链**：

- 行解析、块解析、数学公式（KaTeX）渲染函数
- `SpotlightNoteDocument`
- `PaperSpotlightCards`

1. **主组件 `DimensionPanel`**：

- 状态（滚动、媒体分页、播放控制、缩放补偿）
- effect（重置滚动、资源分页、视口缩放监听）
- render（按 `face.id` 条件渲染不同分支模块）

你改分支页 UI，几乎都在这个文件完成。

### `[client/src/lib/diceData.ts](/Users/yuandai/Documents/New project/mountainzeng-production/client/src/lib/diceData.ts)`

内部结构分为两大段：

1. **类型定义段**（`WorkItem` 到 `DiceFace`）
2. **数据段**（`DICE_FACES` 数组）

`DICE_FACES` 内每个对象对应一个骰子面（1~6），每个面包含：

- 基础字段：`title/tabLabel/subtitle/color/icon`
- 首页字段：`homeDescription/skills/buttonText`
- 分支页字段：`description/quote/coreStatement/works`
- 专属字段：例如系统页 `systemAbilityTree`、算法页 `knowledgeChain`、未来页 `futureDirections` 等

改文案时，通常只动数据段，不动类型定义段。

### `[client/src/lib/visualPortfolio.ts](/Users/yuandai/Documents/New project/mountainzeng-production/client/src/lib/visualPortfolio.ts)`

内部结构是“资源表生成器”：

1. 类型：`VisualVideoItem`、`VisualImageItem`
2. 常量：CDN 基地址、总媒体数量、过滤规则（删某张图、删某些行）
3. 数据生成：

- `VISUAL_VIDEO_ITEMS`（按编号生成）
- `rawVisualImageItems`（按编号生成）
- 行过滤 + 位置过滤 => `VISUAL_IMAGE_ITEMS`

1. URL 构建函数：

- `buildVisualVideoUrl`
- `buildVisualPosterUrl`
- `buildVisualImageUrl`

这个文件决定视觉页“有哪些图/视频”和“URL 怎么拼”。

### `[client/src/index.css](/Users/yuandai/Documents/New project/mountainzeng-production/client/src/index.css)`

内部结构：

1. Tailwind 导入（`@import "tailwindcss"`）
2. 字体声明（`@font-face`）
3. 主题变量（`@theme inline` + `:root`）
4. `@layer base`（基础元素样式）
5. `@layer components`（容器类规则）
6. 全局行为（overscroll、html font-size）
7. 分支页可读性增强（`.branch-readable ...`）
8. 滚动条样式

你改全局字号、字体、对比度，这里是第一入口。

### `[server/index.ts](/Users/yuandai/Documents/New project/mountainzeng-production/server/index.ts)`

内部结构：

1. 初始化 Express + HTTP server
2. 根据 `NODE_ENV` 计算静态目录
3. `express.static` 托管静态文件
4. `app.get("*")` 回退到 `index.html`（前端路由）
5. 监听 `PORT`

这是标准 SPA 静态托管后端。

### `[vite.config.ts](/Users/yuandai/Documents/New project/mountainzeng-production/vite.config.ts)`

内部结构较完整：

1. 插件与工具函数导入
2. Manus Debug Collector 支撑函数：

- `ensureLogDir`
- `trimLogFile`
- `writeToLogFile`
- `vitePluginManusDebugCollector`

1. `defineConfig`：

- 读取环境变量
- 拼装插件数组
- 设置 alias、root、outDir
- 配置 dev server

开发构建行为（路径、端口、输出）都由这里控制。

### `[scripts/railway-redeploy.sh](/Users/yuandai/Documents/New project/mountainzeng-production/scripts/railway-redeploy.sh)`

内部结构是线性流程：

1. 固定项目参数（project/environment/service）
2. 包装 `run_railway` 执行 CLI
3. `whoami` 检查登录
4. `project link` 绑定目标服务
5. `service redeploy` 触发重部署

---

## 8. 非核心但常见目录内部规律

### `[client/src/components/ui/](/Users/yuandai/Documents/New project/mountainzeng-production/client/src/components/ui)`

这批文件多数是 shadcn/Radix 封装组件。  
典型内部结构：

1. 引入 Radix 原子组件
2. 用 `class-variance-authority`/`cn` 封装风格
3. `forwardRef` 导出统一风格组件

这类文件一般用于复用 UI，不放业务逻辑。

### `[client/public/visual-local/](/Users/yuandai/Documents/New project/mountainzeng-production/client/public/visual-local)`

内部按媒体类型分层：

1. `images/`：图片
2. `posters/`：视频封面
3. `media*.mov`：视频原文件

如果 CDN 不可用，可把视觉页回退到本地资源目录。
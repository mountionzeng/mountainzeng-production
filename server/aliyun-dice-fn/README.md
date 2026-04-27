# Aliyun Function Compute · Forged Dice Sync

骰子池跨设备同步的服务端，**全 serverless、零运维**。

- 函数运行时：Aliyun FC 3.0，Node.js 18 / 20
- 存储：阿里云 TableStore（表格存储）—— 按量付费，免费额度足够日常用
- HTTP 入口：FC 自带 HTTPS 域名 `https://<service>-<random>.<region>.fcapp.run`

## 5 步上线

### 1. 在阿里云开通两个服务

1. **表格存储 TableStore**（控制台搜 "tablestore"）→ 创建实例
   - 实例名：`mountain-dice`（或你喜欢的）
   - 区域：杭州 / 上海，与函数计算同 region
   - 实例类型：**容量型**（按量付费，便宜）
2. **函数计算 FC 3.0**（控制台搜 "function compute"）

### 2. 在 TableStore 里建表

进入实例 → 表 → 创建数据表：

| 字段 | 类型 | 主键？ |
|------|------|--------|
| `id` | String | ✅ 是 |

属性列**不需要**预先建（TableStore 是 schema-on-write）。

### 3. 创建 RAM 子账号 + AK/SK

控制台 → 访问控制 RAM → 用户 → 新建用户：
- 勾选 "OpenAPI 调用访问"，记下 AccessKey Id / Secret
- 给这个子账号挂上策略 **`AliyunOTSFullAccess`**（或自定义只允许操作那个表）

### 4. 打包 + 上传函数

在本地这个目录里：

```bash
cd server/aliyun-dice-fn
npm install            # 装 tablestore SDK
npm run pack           # 生成 dist.zip
```

去 FC 控制台：
1. 创建函数 → 选 **"事件函数 / Web 函数"**（HTTP 触发器）
2. 运行环境选 **Node.js 20**
3. 代码上传方式选 "**上传 zip 包**"，传 `dist.zip`
4. 处理函数填 `index.handler`
5. 创建后进入 → 配置 → **环境变量**，加这 6 个：

```
OTS_ENDPOINT          https://mountain-dice.cn-hangzhou.ots.aliyuncs.com
OTS_INSTANCE          mountain-dice
OTS_TABLE             forged_dice
OTS_ACCESS_KEY_ID     <RAM AK>
OTS_ACCESS_KEY_SECRET <RAM SK>
ALLOW_ORIGIN          *      # 上线后改成你的前端域名
```

### 5. 接到前端

FC 函数详情页会显示一个公网调用地址，类似：

```
https://mountain-dice-xxxx.cn-hangzhou.fcapp.run
```

把项目根 `.env` 改成：

```
VITE_DICE_SYNC_ENDPOINT=https://mountain-dice-xxxx.cn-hangzhou.fcapp.run
```

重启 dev / 重新 build —— 前端立即开始把骰子同步到云。

## 验证（curl 三连）

```bash
ENDPOINT=https://mountain-dice-xxxx.cn-hangzhou.fcapp.run

# 1. 写一颗
curl -X POST "$ENDPOINT/dice" \
  -H 'content-type: application/json' \
  -H 'x-device-id: smoke-test' \
  -d '{"id":"test_1","forgedAt":1730000000000,"cards":[
    {"name":"a","description":"","evidence":"","color":"#fff","icon":"Star","id":"c1"},
    {"name":"b","description":"","evidence":"","color":"#fff","icon":"Star","id":"c2"},
    {"name":"c","description":"","evidence":"","color":"#fff","icon":"Star","id":"c3"},
    {"name":"d","description":"","evidence":"","color":"#fff","icon":"Star","id":"c4"},
    {"name":"e","description":"","evidence":"","color":"#fff","icon":"Star","id":"c5"},
    {"name":"f","description":"","evidence":"","color":"#fff","icon":"Star","id":"c6"}]}'

# 2. 列出
curl "$ENDPOINT/dice"

# 3. 随机
curl "$ENDPOINT/dice/random?limit=3"
```

## 接口契约（与 client/src/lib/diceSync.ts 对应）

| Method | Path | Body / Query | Response |
|--------|------|--------------|----------|
| POST | `/dice` | `ForgedDice` JSON | `{ ok: true, id }` |
| GET | `/dice?limit=N` | — | `ForgedDice[]` 时间倒序 |
| GET | `/dice/random?exclude=ID&limit=N` | — | `ForgedDice[]` 随机 |

所有写请求都带 header `x-device-id: <匿名>`，会作为 `device_id` 列存下来，方便后续做归属/反作弊。

## 成本

| 项 | 免费额度 | 之后 |
|----|----------|------|
| 函数计算 | 每月 100 万次调用 + 40 万 GB·s | 0.0133 元/万次 |
| 表格存储 | 每月 25 GB 存储 + 0.5 亿读 + 0.5 亿写 | 几乎可忽略 |

**正常上线初期完全在免费额度内，不需要充钱**。

## 安全建议

- `ALLOW_ORIGIN` 上线前改成你的前端域名（不要 `*`）
- 加阿里云 WAF 或 FC 自带的 **流控限流**（单 IP 每分钟 < 30 次）
- `x-device-id` 是匿名标识，**不要拿来做权限**；要做"我的骰子"必须接真实账号系统

## 进阶

- 想加 "owner" 概念：把 `ForgedDice.ownerId` 改成真实 user id（接 OAuth 后再写）
- 想做 "匹配"：在 TableStore 上加二级索引按 `forged_at` 排序，或导入 SLS 做向量化检索

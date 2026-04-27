# 阿里云骰子同步 —— 上线 Checklist

前端已经把同步层写好了（`client/src/lib/diceSync.ts`）：
- 用户合成骰子 → **本地 localStorage 立即写入**（离线也能用）
- 同时异步 POST 到 `${VITE_DICE_SYNC_ENDPOINT}/dice`
- 推送失败的骰子留在 `pending` 队列，下次启动自动重试
- **对话本身从不进 localStorage、也不上云**（满足"对话本身不会保存"的隐私要求）

要让"别人在其他设备点开还能看见自己/对方的骰子"，你只需要在阿里云上准备一个三接口的 HTTP 服务：

## 接口契约

| 方法 | 路径 | 入参 | 返回 |
|------|------|------|------|
| `POST` | `/dice` | body: `ForgedDice` JSON | `{ ok: true }` |
| `GET`  | `/dice` | — | `ForgedDice[]` |
| `GET`  | `/dice/random?exclude=<id>&limit=<n>` | query | `ForgedDice[]` （未来"匹配"用） |

每个请求 header 带：`x-device-id: <匿名设备 id>`

`ForgedDice` 的 schema 在 `shared/forgedDice.ts`：
```ts
{
  id: string;
  cards: TraitCard[];     // 6 张
  forgedAt: number;
  ownerId?: string;
  ownerName?: string;
}
```

## 阿里云推荐组合

最省事的一套，0 服务器运维：

1. **存储**：阿里云 **TableStore（表格存储）** 或 **RDS MySQL serverless**
   - 表 `forged_dice`：主键 `id` (string)，列 `device_id` / `forged_at` (long) / `payload` (JSON string)
2. **API**：阿里云 **函数计算 FC 3.0** + **HTTP 触发器**（同 AWS Lambda + API Gateway）
   - 一个函数处理 3 条路由即可
3. **域名**：函数计算自带的 `*.fcapp.run` HTTPS 域名直接用，或绑定自有域名

## 部署后

在项目根 `.env` 加一行：
```
VITE_DICE_SYNC_ENDPOINT=https://你的函数地址
```
重启 dev / 重新 build，前端就会自动开始同步。**不配置时整个游戏完全靠本地，不会报错**。

## 安全建议（上线前）

- `x-device-id` 只是匿名标识，**不要相信它做权限控制**。如果担心刷数据，加一个简单的 Cloudflare Turnstile / 阿里云人机验证
- TableStore 的 `payload` 字段建议加大小限制（< 8KB），防止注入巨大 JSON
- POST 接口加速率限制（FC 自带），单 device_id 每分钟 < 5 次合成应该绰绰有余

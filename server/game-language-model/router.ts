/*
 * /api/game/chat 路由 —— 框架无关的 Node http handler
 * 同时被 Vite dev middleware 与生产 Express 复用
 *
 * 请求体: { messages: ChatMessage[], cardsCollected?: number }
 * 响应:   text/event-stream，事件类型见 services/anthropic.ts 中的 StreamEvent
 */

import type { IncomingMessage, ServerResponse } from "http";
import { CONVERSATION_SYSTEM_PROMPT } from "./prompts/conversationSystemPrompt";
import { streamChat, type ChatMessage, type StreamEvent } from "./services/anthropic";

interface RequestBody {
  messages?: ChatMessage[];
  cardsCollected?: number;
}

const MAX_BODY_BYTES = 64 * 1024;

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req: IncomingMessage): Promise<RequestBody> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    req.on("data", (chunk: Buffer) => {
      total += chunk.length;
      if (total > MAX_BODY_BYTES) {
        reject(new Error("request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function writeSse(res: ServerResponse, event: StreamEvent) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

/** 处理 /api/game/chat POST 请求。返回 true 表示已处理 */
export async function handleGameChat(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "method not allowed" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
  const baseUrl = process.env.ANTHROPIC_BASE_URL || undefined;
  // 中文注释：中转站普遍走 Bearer，原生 Anthropic 走 x-api-key（默认）
  const authStyle = process.env.ANTHROPIC_AUTH_STYLE === "bearer" ? "bearer" : "anthropic";
  if (!apiKey) {
    sendJson(res, 500, { error: "ANTHROPIC_API_KEY not configured on server" });
    return;
  }

  let body: RequestBody;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    sendJson(res, 400, { error: `invalid request body: ${(err as Error).message}` });
    return;
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    sendJson(res, 400, { error: "messages required" });
    return;
  }

  const cardsCollected = typeof body.cardsCollected === "number" ? body.cardsCollected : 0;

  // 中文注释：硬约束 —— 用户已经发到第 2 轮（或更多），且还没有任何卡，
  // 那么本轮必须出第一张卡，避免模型一直温柔追问而不动手。
  // 但是！如果最新一条用户消息是 [用户已收集 / 用户跳过] 信号，本回合应当只承接 + 换方向，
  // 不能再硬塞一张卡，否则会和"信号回合纯文本"的规则打架。
  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const isSignalTurn = Boolean(lastUser && /^\[用户(已收集|跳过)：/.test(lastUser.content));
  const forceCard = !isSignalTurn && userMessageCount >= 2 && cardsCollected === 0;

  res.statusCode = 200;
  res.setHeader("content-type", "text/event-stream");
  res.setHeader("cache-control", "no-cache, no-transform");
  res.setHeader("connection", "keep-alive");
  res.setHeader("x-accel-buffering", "no"); // 防止反向代理缓冲

  // 中文注释：客户端断开时让生成器尽早退出（fetch 的 reader 会自动收到错误）
  let aborted = false;
  req.on("close", () => {
    aborted = true;
  });

  try {
    for await (const event of streamChat({
      apiKey,
      model,
      systemPrompt: CONVERSATION_SYSTEM_PROMPT,
      messages,
      cardsCollected,
      baseUrl,
      authStyle,
      forceCard,
    })) {
      if (aborted) break;
      writeSse(res, event);
      if (event.type === "done" || event.type === "error") {
        break;
      }
    }
  } catch (err) {
    writeSse(res, { type: "error", message: (err as Error).message });
  } finally {
    res.end();
  }
}

/** Vite / Express 通用：根据 url 派发 */
export async function gameApiHandler(
  req: IncomingMessage,
  res: ServerResponse,
  next?: () => void,
): Promise<void> {
  const url = req.url ?? "";
  if (url === "/api/game/chat" || url.startsWith("/api/game/chat?")) {
    await handleGameChat(req, res);
    return;
  }
  if (next) next();
}

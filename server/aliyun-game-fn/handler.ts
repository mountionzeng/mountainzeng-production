/*
 * 阿里云函数计算 FC 3.0 —— Game Chat HTTP Handler
 *
 * 把本地 server/game-language-model/router.ts 的逻辑搬到 FC HTTP 函数。
 * 路由：POST /api/game/chat   流式 SSE
 *
 * 环境变量：
 *   ANTHROPIC_API_KEY        —— 必填
 *   ANTHROPIC_MODEL          —— 默认 claude-sonnet-4-6
 *   ANTHROPIC_BASE_URL       —— 可选，中转站地址
 *   ANTHROPIC_AUTH_STYLE     —— anthropic | bearer，默认 anthropic
 *   ALLOW_ORIGIN             —— CORS，默认 *
 *
 * 通过 esbuild 打包：
 *   npx esbuild server/aliyun-game-fn/handler.ts --bundle --platform=node --target=node18 \
 *     --format=cjs --outfile=server/aliyun-game-fn/dist/index.js
 */

import { CONVERSATION_SYSTEM_PROMPT } from "../game-language-model/prompts/conversationSystemPrompt";
import { streamChat, type ChatMessage, type StreamEvent } from "../game-language-model/services/anthropic";

const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || "*";

interface FcRequest {
  method: string;
  path?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  on: (event: string, cb: (...args: any[]) => void) => void;
}

interface FcResponse {
  setStatusCode: (code: number) => void;
  setHeader: (k: string, v: string) => void;
  send: (body?: string) => void;
}

function readBody(req: FcRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function setCors(resp: FcResponse) {
  resp.setHeader("access-control-allow-origin", ALLOW_ORIGIN);
  resp.setHeader("access-control-allow-headers", "content-type");
  resp.setHeader("access-control-allow-methods", "POST, OPTIONS");
}

function sendJson(resp: FcResponse, status: number, payload: unknown) {
  resp.setStatusCode(status);
  resp.setHeader("content-type", "application/json; charset=utf-8");
  setCors(resp);
  resp.send(JSON.stringify(payload));
}

function encodeSse(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export const handler = async (req: FcRequest, resp: FcResponse, _ctx: unknown) => {
  const method = (req.method || "").toUpperCase();
  const rawPath = req.path || req.url || "";
  const path = rawPath.split("?")[0];

  // CORS preflight
  if (method === "OPTIONS") {
    resp.setStatusCode(204);
    setCors(resp);
    resp.setHeader("access-control-max-age", "86400");
    return resp.send("");
  }

  // 健康检查 GET / 直接返回 200
  if (method === "GET") {
    return sendJson(resp, 200, { ok: true, service: "game-chat" });
  }

  if (method !== "POST" || (!path.endsWith("/chat") && path !== "/" && !path.endsWith("/api/game/chat"))) {
    return sendJson(resp, 404, { error: "not found", method, path });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
  const baseUrl = process.env.ANTHROPIC_BASE_URL || undefined;
  const authStyle = process.env.ANTHROPIC_AUTH_STYLE === "bearer" ? "bearer" : "anthropic";

  if (!apiKey) {
    return sendJson(resp, 500, { error: "ANTHROPIC_API_KEY not configured on FC" });
  }

  let body: { messages?: ChatMessage[]; cardsCollected?: number };
  try {
    const raw = await readBody(req);
    body = raw ? JSON.parse(raw) : {};
  } catch (err) {
    return sendJson(resp, 400, { error: `invalid body: ${(err as Error).message}` });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return sendJson(resp, 400, { error: "messages required" });
  }

  const cardsCollected = typeof body.cardsCollected === "number" ? body.cardsCollected : 0;

  // 中文注释：与本地 router 一致的 forceCard 逻辑
  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const isSignalTurn = Boolean(lastUser && /^\[用户(已收集|跳过)：/.test(lastUser.content));
  const forceCard = !isSignalTurn && userMessageCount >= 2 && cardsCollected === 0;

  // 中文注释：FC 2.0 HTTP 函数运行时只暴露 setStatusCode/setHeader/send（一次性返回）。
  // 没有 write/end，所以无法做真正的流式 SSE。这里把所有事件 buffer 起来，结束时一次发出。
  // 前端 SSE 解析器收到完整 payload 后会按 \n\n 分割逐条处理，行为与流式一致，只是体感慢一点。
  resp.setStatusCode(200);
  resp.setHeader("content-type", "text/event-stream; charset=utf-8");
  resp.setHeader("cache-control", "no-cache, no-transform");
  resp.setHeader("x-accel-buffering", "no");
  setCors(resp);

  let buffer = "";
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
      buffer += encodeSse(event);
      if (event.type === "done" || event.type === "error") break;
    }
  } catch (err) {
    buffer += encodeSse({ type: "error", message: (err as Error).message });
  }
  resp.send(buffer);
};

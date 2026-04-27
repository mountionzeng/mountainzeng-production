/*
 * 阿里云函数计算 FC 3.0 —— Forged Dice Sync HTTP Handler
 * 存储：阿里云 OSS（直接把每颗骰子存为 JSON 对象，不依赖 TableStore）
 *
 * 路由：
 *   POST   /dice                              -> 写入一颗新骰子 → oss://<bucket>/<prefix>/<id>.json
 *   GET    /dice                              -> 列出最近 N 颗（默认 50，最多 200）
 *   GET    /dice/random?exclude=...&limit=N   -> 随机取 N 颗（用于"匹配"）
 *
 * 环境变量（FC 控制台配置）：
 *   OSS_REGION             例 cn-beijing
 *   OSS_BUCKET             例 mountion
 *   OSS_PREFIX             默认 dice/，最终对象路径 = <prefix><id>.json
 *   OSS_ACCESS_KEY_ID      RAM 子账号 AK
 *   OSS_ACCESS_KEY_SECRET  RAM 子账号 SK
 *   ALLOW_ORIGIN           默认 *
 *
 * 函数计算上线建议：
 *   - 给函数绑一个 RAM Role 直接走 STS，比上面的 AK/SK 更安全
 *   - 但 AK/SK 走环境变量也能跑，先用这个最少配置版本
 */

"use strict";

const OSS = require("ali-oss");

// ----- OSS client (lazy init, 跨调用复用) -----
let _client = null;
function getClient() {
  if (_client) return _client;
  _client = new OSS({
    region: `oss-${process.env.OSS_REGION || "cn-beijing"}`,
    bucket: process.env.OSS_BUCKET,
    accessKeyId: process.env.OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
    secure: true,
  });
  return _client;
}

const PREFIX = (process.env.OSS_PREFIX || "dice/").replace(/^\/+/, "");
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || "*";

const MAX_PAYLOAD_BYTES = 8 * 1024;
const MAX_LIST_LIMIT = 200;
const DEFAULT_LIST_LIMIT = 50;

function send(resp, status, body) {
  resp.setStatusCode(status);
  resp.setHeader("content-type", "application/json; charset=utf-8");
  resp.setHeader("access-control-allow-origin", ALLOW_ORIGIN);
  resp.setHeader("access-control-allow-headers", "content-type, x-device-id");
  resp.setHeader("access-control-allow-methods", "GET, POST, OPTIONS");
  resp.send(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function parseQuery(rawPath) {
  const idx = rawPath.indexOf("?");
  if (idx === -1) return {};
  const out = {};
  for (const kv of rawPath.slice(idx + 1).split("&")) {
    const [k, v] = kv.split("=");
    if (k) out[decodeURIComponent(k)] = decodeURIComponent(v || "");
  }
  return out;
}

// 中文注释：宽松校验 ForgedDice
function validateDice(dice) {
  if (!dice || typeof dice !== "object") return "missing body";
  if (typeof dice.id !== "string" || !dice.id) return "id required";
  if (!/^[\w\-]{6,40}$/.test(dice.id)) return "id format invalid";
  if (!Array.isArray(dice.cards) || dice.cards.length !== 6) return "cards must be length 6";
  if (typeof dice.forgedAt !== "number") return "forgedAt required";
  for (const c of dice.cards) {
    if (!c || typeof c !== "object") return "invalid card";
    if (typeof c.name !== "string" || typeof c.color !== "string" || typeof c.icon !== "string") {
      return "card missing required fields";
    }
  }
  return null;
}

// ----- POST /dice -----
async function handlePut(req, resp) {
  let body;
  try {
    body = await readBody(req);
  } catch {
    return send(resp, 400, { error: "invalid json" });
  }
  const err = validateDice(body);
  if (err) return send(resp, 400, { error: err });

  const payload = JSON.stringify(body);
  if (Buffer.byteLength(payload, "utf8") > MAX_PAYLOAD_BYTES) {
    return send(resp, 413, { error: "payload too large" });
  }

  const deviceId = String(req.headers["x-device-id"] || "anon").slice(0, 64);
  const objectKey = `${PREFIX}${body.id}.json`;

  try {
    await getClient().put(objectKey, Buffer.from(payload, "utf8"), {
      mime: "application/json",
      meta: {
        // 中文注释：device id 进 metadata，不进对象内容，方便审计
        "device-id": deviceId,
        "forged-at": String(body.forgedAt),
      },
    });
    return send(resp, 200, { ok: true, id: body.id });
  } catch (e) {
    console.error("oss put failed:", e);
    return send(resp, 500, { error: "oss write failed" });
  }
}

// 中文注释：列出 prefix 下所有对象，按 lastModified 倒序
async function listAll(maxKeys = 200) {
  const items = [];
  let nextMarker = undefined;
  // 简化：单次 list 最多 1000 个，对小规模够用
  const result = await getClient().list({
    prefix: PREFIX,
    "max-keys": Math.min(1000, maxKeys * 4),
    marker: nextMarker,
  }, {});
  if (result && Array.isArray(result.objects)) {
    for (const obj of result.objects) items.push(obj);
  }
  return items;
}

async function fetchDice(name) {
  try {
    const r = await getClient().get(name);
    return JSON.parse(r.content.toString("utf8"));
  } catch {
    return null;
  }
}

// ----- GET /dice -----
async function handleList(req, resp) {
  const q = parseQuery(req.path || req.url || "");
  const limit = Math.min(MAX_LIST_LIMIT, Math.max(1, parseInt(q.limit, 10) || DEFAULT_LIST_LIMIT));

  try {
    const items = await listAll(limit);
    items.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
    const slice = items.slice(0, limit);
    const dice = await Promise.all(slice.map((it) => fetchDice(it.name)));
    return send(resp, 200, dice.filter(Boolean));
  } catch (e) {
    console.error("oss list failed:", e);
    return send(resp, 500, { error: "oss read failed" });
  }
}

// ----- GET /dice/random -----
async function handleRandom(req, resp) {
  const q = parseQuery(req.path || req.url || "");
  const limit = Math.min(20, Math.max(1, parseInt(q.limit, 10) || 5));
  const exclude = q.exclude || "";

  try {
    let items = await listAll(200);
    if (exclude) items = items.filter((it) => !it.name.endsWith(`/${exclude}.json`));
    // Fisher-Yates partial shuffle
    for (let i = items.length - 1; i > items.length - 1 - limit && i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    const slice = items.slice(-limit);
    const dice = await Promise.all(slice.map((it) => fetchDice(it.name)));
    return send(resp, 200, dice.filter(Boolean).reverse());
  } catch (e) {
    console.error("oss list failed:", e);
    return send(resp, 500, { error: "oss read failed" });
  }
}

// ----- 路由分发 -----
exports.handler = async (req, resp, _context) => {
  const method = (req.method || "").toUpperCase();
  const rawPath = req.path || req.url || "";
  const path = rawPath.split("?")[0];

  if (method === "OPTIONS") {
    resp.setStatusCode(204);
    resp.setHeader("access-control-allow-origin", ALLOW_ORIGIN);
    resp.setHeader("access-control-allow-headers", "content-type, x-device-id");
    resp.setHeader("access-control-allow-methods", "GET, POST, OPTIONS");
    resp.setHeader("access-control-max-age", "86400");
    return resp.send("");
  }

  if (method === "GET" && path === "/") {
    return send(resp, 200, { ok: true, service: "dice-sync", storage: "oss" });
  }

  if (method === "POST" && path.endsWith("/dice")) return handlePut(req, resp);
  if (method === "GET" && path.endsWith("/dice/random")) return handleRandom(req, resp);
  if (method === "GET" && path.endsWith("/dice")) return handleList(req, resp);

  return send(resp, 404, { error: "not found", method, path });
};

/*
 * diceSync —— 跨设备骰子同步层（阿里云后端）
 *
 * 设计原则：
 *  - localStorage 永远是真理来源的"本地缓存"，离线时也能秒开
 *  - 当配置了 VITE_DICE_SYNC_ENDPOINT 时，会异步把骰子同步到云端
 *  - 同步失败不会阻塞 UI；失败的写入留在 localStorage，下次启动会自动重试
 *
 * 服务端契约（供阿里云函数计算 / API Gateway 实现）：
 *
 *   POST  ${endpoint}/dice         body: ForgedDice              -> { ok: true }
 *   GET   ${endpoint}/dice                                       -> ForgedDice[]
 *   GET   ${endpoint}/dice/random?exclude=<id>&limit=<n>        -> ForgedDice[]   (用于"匹配"功能)
 *
 * 鉴权：先用一个匿名 deviceId（首次启动时本地生成 nanoid 存到 localStorage），
 *       后续可换成真实账号。每次请求带 header: x-device-id: <uuid>
 */

import type { ForgedDice } from "@shared/forgedDice";
import { addDice as addDiceLocal, loadPool as loadPoolLocal } from "./dicePool";

const SYNC_ENDPOINT = (import.meta as any).env?.VITE_DICE_SYNC_ENDPOINT as string | undefined;
const DEVICE_ID_KEY = "mountain.deviceId.v1";
const PENDING_KEY = "mountain.dicePool.pending.v1";

function getDeviceId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = window.localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

function readPending(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writePending(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PENDING_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

function markPending(id: string) {
  const list = readPending();
  if (!list.includes(id)) writePending([...list, id]);
}

function clearPending(id: string) {
  writePending(readPending().filter((x) => x !== id));
}

async function pushOne(dice: ForgedDice): Promise<boolean> {
  if (!SYNC_ENDPOINT) return false;
  try {
    const res = await fetch(`${SYNC_ENDPOINT.replace(/\/$/, "")}/dice`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-device-id": getDeviceId(),
      },
      body: JSON.stringify(dice),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * 公共 API：本地写入 + 远端推送（best-effort）
 *
 * 注意：localStorage 是同步的、立即生效；远端是异步的、可以失败。
 * 失败的写入会进入 pending 队列，下次启动 / 手动 retry 时再发。
 */
export async function addDiceSynced(dice: ForgedDice): Promise<void> {
  // 第一步：本地永远先写入
  addDiceLocal(dice);

  if (!SYNC_ENDPOINT) return;

  // 第二步：远端 best-effort
  markPending(dice.id);
  const ok = await pushOne(dice);
  if (ok) clearPending(dice.id);
}

/**
 * 启动时调用：把所有 pending 的骰子重试推一次
 */
export async function flushPending(): Promise<void> {
  if (!SYNC_ENDPOINT) return;
  const pending = readPending();
  if (pending.length === 0) return;
  const pool = loadPoolLocal();
  for (const id of pending) {
    const dice = pool.find((d) => d.id === id);
    if (!dice) {
      clearPending(id);
      continue;
    }
    const ok = await pushOne(dice);
    if (ok) clearPending(id);
  }
}

/** 是否启用了云端同步（UI 可以用来显示"☁️ 已同步"或"📵 仅本地"小标） */
export function isSyncEnabled(): boolean {
  return Boolean(SYNC_ENDPOINT);
}

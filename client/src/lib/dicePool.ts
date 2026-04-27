/*
 * dicePool —— 已合成骰子的本地持久化层
 *
 * 设计目标：把"读 / 写已合成骰子"封装成一个 swap-able service。
 * 当前后端是 localStorage；将来切到 Supabase / 自建 API 时，
 * 只需要把这里的实现换掉，调用方（MiniDiceScene 等）完全不用改。
 *
 * 之后切后端时，建议保留同一组函数签名：
 *   loadPool() / addDice() / removeDice() / clearPool() / subscribe()
 * 实现内部改成 fetch('/api/dice') 即可。
 */

import type { ForgedDice } from "@shared/forgedDice";

const STORAGE_KEY = "mountain.dicePool.v1";

type Listener = (pool: ForgedDice[]) => void;
const listeners = new Set<Listener>();

function safeRead(): ForgedDice[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // 中文注释：宽松校验，避免老数据格式抛错把整个池子吞掉
    return parsed.filter(
      (d: any) => d && typeof d.id === "string" && Array.isArray(d.cards) && d.cards.length === 6,
    ) as ForgedDice[];
  } catch {
    return [];
  }
}

function safeWrite(pool: ForgedDice[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pool));
  } catch {
    /* quota / private mode → 静默失败，避免阻塞 UI */
  }
}

function notify(pool: ForgedDice[]) {
  // 中文注释：用 forEach 替代 for-of，避免老 tsconfig 的 downlevelIteration 限制
  listeners.forEach((l) => {
    try {
      l(pool);
    } catch {
      /* listener 自身错误不应该影响其他 listener */
    }
  });
}

/** 读取当前已合成的骰子池（按时间倒序：最新的在前） */
export function loadPool(): ForgedDice[] {
  return safeRead().sort((a, b) => b.forgedAt - a.forgedAt);
}

/** 追加一颗新骰子，返回更新后的完整池 */
export function addDice(dice: ForgedDice): ForgedDice[] {
  const pool = safeRead();
  const next = [dice, ...pool.filter((d) => d.id !== dice.id)];
  safeWrite(next);
  notify(next);
  return next;
}

/** 按 id 删除一颗骰子（暂未在 UI 用，留作后续管理用） */
export function removeDice(id: string): ForgedDice[] {
  const next = safeRead().filter((d) => d.id !== id);
  safeWrite(next);
  notify(next);
  return next;
}

/** 清空整个池子（开发期重置用） */
export function clearPool(): void {
  safeWrite([]);
  notify([]);
}

/** 订阅池子变化（同窗口内多组件同步） */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** 跨标签页同步：localStorage 在另一个标签页改动时会触发 storage 事件 */
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      notify(loadPool());
    }
  });
}

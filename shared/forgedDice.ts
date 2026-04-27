/*
 * ForgedDice —— 用户用 6 张特质卡合成的"骰子"数据结构
 * 前后端共享。后端持久化层（Supabase / 自建 API）写入这个 schema 即可
 */

import type { TraitCard } from "./traitCard";

export interface ForgedDice {
  /** nanoid，唯一标识 */
  id: string;
  /** 恰好 6 张卡，对应 6 个面 */
  cards: TraitCard[];
  /** 合成时间戳，Unix ms */
  forgedAt: number;
  /** 可选的所有者标识，用于将来跨设备同步 */
  ownerId?: string;
  /** 可选的展示名 */
  ownerName?: string;
}

export const FORGED_DICE_FACES = 6;

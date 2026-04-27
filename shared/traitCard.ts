/*
 * Trait Card 共享类型 —— 前后端复用
 * 后端 server/game-language-model/schemas/traitCard.ts 直接 re-export 这里的类型
 */

export interface TraitCard {
  id: string;
  name: string;
  description: string;
  evidence: string;
  color: string;
  icon: string;
}

export type TraitCardDraft = Omit<TraitCard, "id">;

export const TRAIT_CARD_TARGET_COUNT = 6;

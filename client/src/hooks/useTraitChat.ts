/*
 * useTraitChat —— 与服务端 /api/game/chat SSE 流式接口对接
 * 维护对话历史、当前正在流式生成的回复、已收集的特质卡集合
 */

import { useCallback, useRef, useState } from "react";
import { nanoid } from "nanoid";
import type { TraitCard, TraitCardDraft } from "@shared/traitCard";

export interface ChatTurn {
  id: string;
  role: "user" | "assistant";
  text: string;
  /** 该回合内联生成的卡片（assistant 回合才会出现），未被加入骰子前一直挂在这里 */
  card?: TraitCard;
  /**
   * 中文注释：标记这是一条"信号回合"——用户在 UI 点击"收集/跳过"时由前端自动发出。
   * 渲染时应当显示得更轻（小字、低饱和度），避免和真实对话抢戏。
   */
  isSignal?: boolean;
}

interface ChatRequestBody {
  messages: { role: "user" | "assistant"; content: string }[];
  cardsCollected: number;
}

interface SendOptions {
  /** 卡片刚生成时立刻回调，方便外部触发动画或音效 */
  onCardGenerated?: (card: TraitCard) => void;
}

interface UseTraitChatResult {
  turns: ChatTurn[];
  /** 当前正在流式增长的 assistant 文本，未提交到 turns。null = 没有进行中的回合 */
  pendingAssistantText: string | null;
  isStreaming: boolean;
  error: string | null;
  /** 已加入骰子的卡片（按加入顺序，最多 6 张） */
  selectedCards: TraitCard[];
  send: (userText: string, options?: SendOptions) => Promise<void>;
  addCardToDice: (card: TraitCard) => void;
  removeCardFromDice: (cardId: string) => void;
  /**
   * 中文注释：用户对一张刚出现的卡做出"收集 / 跳过"决定后调用。
   * 1) 写入 selectedCards（仅 collect 时）
   * 2) 同步发一条"信号"用户回合给模型，触发"承接 + 下一个新方向问题"
   */
  acknowledgeCard: (card: TraitCard, action: "collect" | "skip") => Promise<void>;
  reset: () => void;
}

// 中文注释：本地开发走 Vite 代理 /api/game/chat；生产环境走 FC URL（VITE_GAME_API_BASE）
// 末尾不带斜杠，最终请求 = `${BASE}/chat`
const GAME_API_BASE = ((import.meta as any).env?.VITE_GAME_API_BASE as string | undefined)?.replace(/\/$/, "");
const ENDPOINT = GAME_API_BASE ? `${GAME_API_BASE}/chat` : "/api/game/chat";

export function useTraitChat(): UseTraitChatResult {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [pendingAssistantText, setPendingAssistantText] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCards, setSelectedCards] = useState<TraitCard[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  // 中文注释：内部统一发送函数。signal=true 时这是"收集/跳过"自动触发的信号回合，
  // 不算用户主动输入，UI 渲染时会更轻。
  const sendInternal = useCallback(
    async (
      userText: string,
      opts: { signal?: boolean; cardsCollectedAfter?: number; options?: SendOptions } = {},
    ) => {
      if (!userText.trim() || isStreaming) return;

      setError(null);

      const userTurn: ChatTurn = {
        id: nanoid(8),
        role: "user",
        text: userText,
        isSignal: opts.signal === true,
      };
      const nextTurns = [...turns, userTurn];
      setTurns(nextTurns);
      setPendingAssistantText("");
      setIsStreaming(true);

      // 中文注释：把 assistant 回合里的卡片信息序列化到 content 里。
      // 否则模型每次都看不到自己上一轮通过 tool_use 出过卡 → 会在信号回合又生成新卡。
      const serializeTurn = (t: ChatTurn): { role: "user" | "assistant"; content: string } => {
        if (t.role === "assistant" && t.card) {
          const cardLine = `[上一轮已生成卡片：${t.card.name} — ${t.card.description}]`;
          return { role: "assistant", content: t.text ? `${t.text}\n${cardLine}` : cardLine };
        }
        return { role: t.role, content: t.text };
      };
      const body: ChatRequestBody = {
        messages: nextTurns.map(serializeTurn),
        // 中文注释：信号回合可能伴随 selectedCards 即将+1，传"+1 之后"的值给后端，
        // 让 forceCard 等节奏判断准确
        cardsCollected:
          typeof opts.cardsCollectedAfter === "number"
            ? opts.cardsCollectedAfter
            : selectedCards.length,
      };

      const controller = new AbortController();
      abortRef.current = controller;

      let accumulatedText = "";
      let generatedCard: TraitCard | undefined;

      try {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const text = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let sep: number;
          while ((sep = buffer.indexOf("\n\n")) !== -1) {
            const raw = buffer.slice(0, sep);
            buffer = buffer.slice(sep + 2);
            const dataLine = raw.split("\n").find((l) => l.startsWith("data:"));
            if (!dataLine) continue;
            const json = dataLine.slice(5).trim();
            if (!json) continue;

            try {
              const event = JSON.parse(json);
              if (event.type === "text_delta") {
                accumulatedText += event.delta;
                setPendingAssistantText(accumulatedText);
              } else if (event.type === "card") {
                const draft = event.card as TraitCardDraft;
                generatedCard = { ...draft, id: nanoid(8) };
                opts.options?.onCardGenerated?.(generatedCard);
              } else if (event.type === "error") {
                throw new Error(event.message);
              }
              // type === "done" 不需要特殊处理，循环会自然结束
            } catch (parseErr) {
              if ((parseErr as Error).message?.startsWith("HTTP ")) throw parseErr;
              // SSE 解析错误忽略，让流继续
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError((err as Error).message);
      } finally {
        // 把流式累积的文本与可能生成的卡片合成一个 assistant turn
        if (accumulatedText || generatedCard) {
          setTurns((prev) => [
            ...prev,
            {
              id: nanoid(8),
              role: "assistant",
              text: accumulatedText,
              card: generatedCard,
            },
          ]);
        }
        setPendingAssistantText(null);
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [isStreaming, selectedCards.length, turns],
  );

  const addCardToDice = useCallback((card: TraitCard) => {
    setSelectedCards((prev) => {
      if (prev.length >= 6 || prev.some((c) => c.id === card.id)) return prev;
      return [...prev, card];
    });
  }, []);

  const removeCardFromDice = useCallback((cardId: string) => {
    setSelectedCards((prev) => prev.filter((c) => c.id !== cardId));
  }, []);

  // 中文注释：对外暴露的 send —— 真实用户输入
  const send = useCallback(
    (userText: string, options?: SendOptions) => sendInternal(userText, { options }),
    [sendInternal],
  );

  /**
   * 中文注释：用户在卡片 UI 点 "收集" / "跳过" 时调用。
   * 1) collect 时把卡加入 selectedCards
   * 2) 自动给模型发一条 [已收集 X] 或 [跳过 X] 的信号回合
   *    模型会按 system prompt 的约定：1 句承接 + 1 个新方向问题
   *
   * 这是修复"出卡后对话戛然而止"的关键 —— Anthropic API 的 tool_use 一旦触发就立刻结束当前回合，
   * 所以只能由前端在用户做出选择那一刻自动续上一回合。
   */
  const acknowledgeCard = useCallback(
    async (card: TraitCard, action: "collect" | "skip") => {
      if (isStreaming) return;
      const isFull = selectedCards.length >= 6;
      let nextCount = selectedCards.length;

      if (action === "collect" && !isFull && !selectedCards.some((c) => c.id === card.id)) {
        setSelectedCards((prev) => [...prev, card]);
        nextCount = selectedCards.length + 1;
      }

      const signalText =
        action === "collect"
          ? `[用户已收集：${card.name}]`
          : `[用户跳过：${card.name}]`;

      await sendInternal(signalText, {
        signal: true,
        cardsCollectedAfter: nextCount,
      });
    },
    [isStreaming, selectedCards, sendInternal],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setTurns([]);
    setPendingAssistantText(null);
    setIsStreaming(false);
    setError(null);
    setSelectedCards([]);
  }, []);

  return {
    turns,
    pendingAssistantText,
    isStreaming,
    error,
    selectedCards,
    send,
    addCardToDice,
    removeCardFromDice,
    acknowledgeCard,
    reset,
  };
}

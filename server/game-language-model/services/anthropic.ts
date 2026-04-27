/*
 * Anthropic Messages API 流式调用 —— 用 fetch + SSE 解析，避免引入额外依赖
 * 同时支持文本流和 tool_use 事件
 */

import { TRAIT_CARD_COLORS, TRAIT_CARD_ICONS, type TraitCardDraft } from "../schemas/traitCard";

const DEFAULT_ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_VERSION = "2023-06-01";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** 服务端流式输出的事件类型，给前端 SSE 消费 */
export type StreamEvent =
  | { type: "text_delta"; delta: string }
  | { type: "card"; card: TraitCardDraft }
  | { type: "done"; stopReason: string | null }
  | { type: "error"; message: string };

const TRAIT_CARD_TOOL = {
  name: "generate_trait_card",
  description:
    "在对话中发现用户的一个鲜明人格优势时调用，将其凝结为一张特质卡。一次只能生成一张。",
  input_schema: {
    type: "object" as const,
    properties: {
      name: {
        type: "string",
        description: "卡片标题，4-8 个汉字或 2-3 个英文词，像角色称号",
      },
      description: {
        type: "string",
        description: "30-60 字的第二人称一句话描述",
      },
      evidence: {
        type: "string",
        description: "引用用户对话中的关键线索",
      },
      color: {
        type: "string",
        enum: [...TRAIT_CARD_COLORS],
        description: "卡片主题色",
      },
      icon: {
        type: "string",
        enum: [...TRAIT_CARD_ICONS],
        description: "lucide-react 图标名",
      },
    },
    required: ["name", "description", "evidence", "color", "icon"],
  },
};

interface StreamOptions {
  apiKey: string;
  model: string;
  systemPrompt: string;
  messages: ChatMessage[];
  /** 已生成的卡片数，用于在 system prompt 末尾告诉模型当前进度 */
  cardsCollected: number;
  /** 可选：覆盖默认 Anthropic endpoint，用于第三方中转站 */
  baseUrl?: string;
  /** 可选：鉴权风格 —— "anthropic" 用 x-api-key，"bearer" 用 Authorization: Bearer。默认 anthropic */
  authStyle?: "anthropic" | "bearer";
  /**
   * 可选：强制模型必须调用 generate_trait_card 工具。
   * 用于"到第 2 轮必须出第一张卡"这种硬约束场景。
   */
  forceCard?: boolean;
}

/** 与 Anthropic API（或 Anthropic-compatible 中转站）建立流式连接，把事件 yield 给调用方 */
export async function* streamChat(options: StreamOptions): AsyncGenerator<StreamEvent, void, unknown> {
  const { apiKey, model, systemPrompt, messages, cardsCollected, baseUrl, authStyle = "anthropic", forceCard = false } = options;

  const remaining = Math.max(0, 6 - cardsCollected);
  const progressNote = `\n\n## 当前进度\n已收集卡片：${cardsCollected} / 6（剩余 ${remaining} 张）`;
  // 中文注释：硬约束模式 —— 把"必须出卡"放在最高优先级，覆盖所有"温柔追问"的指引
  const forceNote = forceCard
    ? `

## 🚨 本回合输出要求（最高优先级，覆盖前述所有节奏建议）

**用户已经是第 2 次回复，且当前 0 张卡。**

你本次响应必须满足以下两条：
1. **必须调用 generate_trait_card 工具产出 1 张卡**（基于已有对话直接产出，不要再追问、不要"先确认一下"、不要"再了解多一点"）
2. 工具调用之前可以、也建议先输出 1-2 句承接性的 text（比如"我先把这个特质递给你看看"），但 text 不能取代工具调用

**输出失败的判定**：本次响应只有 text 没有 tool_use → 系统会强制重试，浪费用户等待时间。
**材料感觉薄？** 没关系，从用户已经说过的任何一句话里提取一个具体意象做 evidence 即可。第一张卡是"开局礼物"，不是"最终判决"，用户后面还会收集 5 张。`
    : "";

  const body: Record<string, unknown> = {
    model,
    max_tokens: 1024,
    system: systemPrompt + progressNote + forceNote,
    tools: [TRAIT_CARD_TOOL],
    messages,
    stream: true,
  };

  // 中文注释：tool_choice 是 Anthropic 原生字段，强制模型必须调用指定工具
  if (forceCard) {
    body.tool_choice = { type: "tool", name: "generate_trait_card" };
  }

  // 中文注释：根据鉴权风格构造 header；中转站普遍走 Bearer，原生 Anthropic 走 x-api-key
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "anthropic-version": ANTHROPIC_API_VERSION,
  };
  if (authStyle === "bearer") {
    headers["authorization"] = `Bearer ${apiKey}`;
  } else {
    headers["x-api-key"] = apiKey;
  }

  const endpoint = baseUrl || DEFAULT_ANTHROPIC_ENDPOINT;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch (err) {
    yield { type: "error", message: `network error: ${(err as Error).message}` };
    return;
  }

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => "");
    yield { type: "error", message: `Anthropic API ${response.status}: ${text.slice(0, 500)}` };
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  // 中文注释：跟踪当前 tool_use 块的 JSON 增量拼接，结束时一次性解析为卡片
  const toolBlocks = new Map<number, { name: string; jsonChunks: string[] }>();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE 事件以两个换行分隔
      let separatorIdx: number;
      while ((separatorIdx = buffer.indexOf("\n\n")) !== -1) {
        const rawEvent = buffer.slice(0, separatorIdx);
        buffer = buffer.slice(separatorIdx + 2);

        const dataLine = rawEvent
          .split("\n")
          .find((line) => line.startsWith("data:"));
        if (!dataLine) continue;

        const json = dataLine.slice("data:".length).trim();
        if (!json) continue;

        let parsed: any;
        try {
          parsed = JSON.parse(json);
        } catch {
          continue;
        }

        const eventType = parsed.type as string;

        if (eventType === "content_block_start") {
          const block = parsed.content_block;
          if (block?.type === "tool_use") {
            toolBlocks.set(parsed.index, { name: block.name, jsonChunks: [] });
          }
        } else if (eventType === "content_block_delta") {
          const delta = parsed.delta;
          if (delta?.type === "text_delta" && typeof delta.text === "string") {
            yield { type: "text_delta", delta: delta.text };
          } else if (delta?.type === "input_json_delta" && typeof delta.partial_json === "string") {
            const block = toolBlocks.get(parsed.index);
            if (block) block.jsonChunks.push(delta.partial_json);
          }
        } else if (eventType === "content_block_stop") {
          const block = toolBlocks.get(parsed.index);
          if (block && block.name === "generate_trait_card") {
            try {
              const card = JSON.parse(block.jsonChunks.join("")) as TraitCardDraft;
              yield { type: "card", card };
            } catch (err) {
              yield { type: "error", message: `failed to parse trait card: ${(err as Error).message}` };
            }
            toolBlocks.delete(parsed.index);
          }
        } else if (eventType === "message_delta") {
          const stopReason = parsed.delta?.stop_reason ?? null;
          if (stopReason) {
            yield { type: "done", stopReason };
          }
        } else if (eventType === "error") {
          yield { type: "error", message: parsed.error?.message ?? "unknown stream error" };
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

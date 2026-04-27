/*
 * TraitChatPanel —— "无限可能"分支底部的真实对话 + 内联卡片生成 UI
 * 接管原本静态 mockup 的位置，对接 useTraitChat hook 调用 /api/game/chat
 */

import { useEffect, useRef, useState } from "react";
import type { SVGProps } from "react";
import * as LucideIcons from "lucide-react";
import { Sparkles } from "lucide-react";
import { useTraitChat, type ChatTurn } from "@/hooks/useTraitChat";
import type { TraitCard } from "@shared/traitCard";
import { TRAIT_CARD_TARGET_COUNT } from "@shared/traitCard";

const renderIcon = (iconName: string, props: SVGProps<SVGSVGElement> & { className?: string }) => {
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent ? <IconComponent {...props} /> : <Sparkles {...props} />;
};

interface TraitChatPanelProps {
  accentColor: string;
  isEn: boolean;
  onCollectedCardsChange?: (cards: TraitCard[]) => void;
}

const OPENING_LINE_ZH =
  "Hi，我想认识一下真实的你。我们慢慢聊几轮，我会在听到亮点时把它做成一张特质卡 —— 攒齐 6 张就能合成一颗只属于你的骰子。";
const OPENING_LINE_EN =
  "Hi! I want to get to know the real you. We'll chat for a few rounds — when something catches my ear, I'll turn it into a trait card. Collect 6 to forge a dice that's only yours.";

const FIRST_QUESTION_ZH = "先问个不大不小的：上一次你做完一件事，觉得'只有我能做成这样'，是什么？";
const FIRST_QUESTION_EN =
  "Let's start gentle: think of the last thing you finished where you felt 'only I could have done it this way'. What was it?";

export default function TraitChatPanel({ accentColor, isEn, onCollectedCardsChange }: TraitChatPanelProps) {
  const {
    turns,
    pendingAssistantText,
    isStreaming,
    error,
    selectedCards,
    send,
    acknowledgeCard,
  } = useTraitChat();

  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // 中文注释：每次有新内容滚到底，保证用户看到最新对话
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [turns, pendingAssistantText]);

  // 中文注释：把当前已收集卡片向父层同步，用于右侧骰子墙联动展示。
  useEffect(() => {
    onCollectedCardsChange?.(selectedCards);
  }, [onCollectedCardsChange, selectedCards]);

  const handleSubmit = async () => {
    const text = inputValue.trim();
    if (!text || isStreaming) return;
    setInputValue("");
    await send(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  // 引导语：用户还没说话时，AI 已先抛出开场 + 第一题
  const openingTurns: ChatTurn[] =
    turns.length === 0
      ? [
          { id: "opening-1", role: "assistant", text: isEn ? OPENING_LINE_EN : OPENING_LINE_ZH },
          { id: "opening-2", role: "assistant", text: isEn ? FIRST_QUESTION_EN : FIRST_QUESTION_ZH },
        ]
      : [];
  const displayTurns = [...openingTurns, ...turns];

  const cardInDice = (card: TraitCard) => selectedCards.some((c) => c.id === card.id);

  return (
    <div
      className="rounded-xl relative overflow-hidden p-4 md:p-5 flex flex-col"
      style={{
        background: "linear-gradient(140deg, rgba(255,255,255,0.05), rgba(0,0,0,0.28))",
        border: `1px solid ${accentColor}30`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className="text-[11px] tracking-[0.3em] uppercase font-semibold"
          style={{ fontFamily: "var(--font-label)", color: `${accentColor}AA` }}
        >
          {isEn ? "Trait Conversation" : "特质对话"}
        </div>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: TRAIT_CARD_TARGET_COUNT }).map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-500"
              style={{
                width: i < selectedCards.length ? 8 : 6,
                height: i < selectedCards.length ? 8 : 6,
                background: i < selectedCards.length
                  ? (selectedCards[i]?.color ?? accentColor)
                  : `${accentColor}30`,
                boxShadow: i < selectedCards.length
                  ? `0 0 6px ${selectedCards[i]?.color ?? accentColor}88`
                  : "none",
              }}
            />
          ))}
          <span
            className="ml-1 text-[10px] font-semibold"
            style={{ color: `${accentColor}99`, fontFamily: "var(--font-label)" }}
          >
            {selectedCards.length}/{TRAIT_CARD_TARGET_COUNT}
          </span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="h-[320px] rounded-lg p-3 md:p-4 space-y-3 overflow-y-auto bg-black/30 border border-white/10"
      >
        {displayTurns.map((turn) => (
          <TurnBubble
            key={turn.id}
            turn={turn}
            accentColor={accentColor}
            isEn={isEn}
            disabled={
              turn.card
                ? cardInDice(turn.card)
                  ? "added"
                  : selectedCards.length >= TRAIT_CARD_TARGET_COUNT
                    ? "full"
                    : "available"
                : "available"
            }
            onAcknowledgeCard={acknowledgeCard}
          />
        ))}

        {pendingAssistantText !== null && (
          <div className="flex justify-start">
            <div className="max-w-[86%] rounded-2xl rounded-bl-md px-3 py-2 text-sm text-white/85 bg-white/8 border border-white/10">
              {pendingAssistantText || (
                <span className="inline-flex gap-1 items-center text-white/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" style={{ animationDelay: "0.15s" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" style={{ animationDelay: "0.3s" }} />
                </span>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="text-[12px] text-red-300/80 px-2 py-1.5 rounded-md border border-red-400/30 bg-red-500/10">
            {isEn ? "Something went wrong: " : "出错了："}
            {error}
          </div>
        )}
      </div>

      <div
        className="mt-3 rounded-lg border bg-black/35 px-3 py-2 flex items-end gap-2"
        style={{ borderColor: "rgba(255,255,255,0.15)" }}
      >
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={isEn ? "Type your reply..." : "说说你的想法..."}
          disabled={isStreaming}
          className="flex-1 bg-transparent resize-none outline-none text-sm text-white placeholder:text-white/35 max-h-32"
          style={{ fontFamily: "var(--font-body, inherit)" }}
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!inputValue.trim() || isStreaming}
          className="text-[11px] tracking-[0.2em] uppercase font-semibold px-3 py-1.5 rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            fontFamily: "var(--font-label)",
            color: accentColor,
            background: `${accentColor}1F`,
            border: `1px solid ${accentColor}55`,
          }}
        >
          {isStreaming ? (isEn ? "..." : "生成中") : isEn ? "Send" : "发送"}
        </button>
      </div>
    </div>
  );
}

interface TurnBubbleProps {
  turn: ChatTurn;
  accentColor: string;
  isEn: boolean;
  disabled: "available" | "added" | "full";
  onAcknowledgeCard: (card: TraitCard, action: "collect" | "skip") => void;
}

function TurnBubble({ turn, accentColor, isEn, disabled, onAcknowledgeCard }: TurnBubbleProps) {
  if (turn.role === "user") {
    // 中文注释：信号回合（[已收集 X] / [跳过 X]）渲染得轻一些，避免和真实对话抢戏
    if (turn.isSignal) {
      const isCollect = turn.text.startsWith("[用户已收集");
      const cardName = turn.text.replace(/^\[用户(已收集|跳过)：/, "").replace(/\]$/, "");
      return (
        <div className="flex justify-end">
          <div
            className="text-[10px] tracking-wider px-2 py-0.5 rounded-full opacity-80"
            style={{
              fontFamily: "var(--font-label)",
              color: `${accentColor}CC`,
              background: `${accentColor}10`,
              border: `1px dashed ${accentColor}40`,
            }}
          >
            {isCollect
              ? (isEn ? `✓ Collected · ${cardName}` : `✓ 收集了 · ${cardName}`)
              : (isEn ? `↷ Skipped · ${cardName}` : `↷ 跳过 · ${cardName}`)}
          </div>
        </div>
      );
    }
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[86%] rounded-2xl rounded-br-md px-3 py-2 text-sm text-white whitespace-pre-wrap"
          style={{
            background: `linear-gradient(135deg, ${accentColor}AA, ${accentColor}66)`,
            border: `1px solid ${accentColor}88`,
          }}
        >
          {turn.text}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {turn.text && (
        <div className="flex justify-start">
          <div className="max-w-[86%] rounded-2xl rounded-bl-md px-3 py-2 text-sm text-white/85 bg-white/8 border border-white/10 whitespace-pre-wrap">
            {turn.text}
          </div>
        </div>
      )}

      {turn.card && (
        <div className="flex justify-start">
          <div className="max-w-[92%] w-full">
            <div
              className="text-[10px] tracking-[0.3em] uppercase font-semibold mb-1.5"
              style={{ fontFamily: "var(--font-label)", color: `${turn.card.color}D0` }}
            >
              {isEn ? "✦ New trait card" : "✦ 新的特质卡"}
            </div>
            <div
              className="rounded-xl p-3.5 flex gap-3 items-start"
              style={{
                background: `linear-gradient(135deg, ${turn.card.color}26, rgba(0,0,0,0.55))`,
                border: `1px solid ${turn.card.color}66`,
                boxShadow: `0 0 24px ${turn.card.color}25 inset`,
              }}
            >
              <div
                className="h-10 w-10 rounded-lg flex-shrink-0 flex items-center justify-center"
                style={{
                  background: `${turn.card.color}30`,
                  border: `1px solid ${turn.card.color}90`,
                  color: turn.card.color,
                }}
              >
                {renderIcon(turn.card.icon, { width: 18, height: 18 } as any)}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="text-sm font-semibold text-white"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {turn.card.name}
                </div>
                <div className="text-[12px] leading-snug text-white/75 mt-1">{turn.card.description}</div>
                <div className="text-[11px] leading-snug text-white/45 mt-1.5 italic">
                  {isEn ? "From: " : "线索："}
                  {turn.card.evidence}
                </div>
                <div className="flex gap-2 mt-2.5 items-center">
                  <button
                    type="button"
                    onClick={() => disabled === "available" && onAcknowledgeCard(turn.card!, "collect")}
                    disabled={disabled !== "available"}
                    className="text-[11px] px-2.5 py-1 rounded-md font-semibold disabled:cursor-not-allowed disabled:opacity-60 transition-all hover:brightness-125"
                    style={{
                      fontFamily: "var(--font-label)",
                      color: turn.card.color,
                      background: `${turn.card.color}28`,
                      border: `1px solid ${turn.card.color}66`,
                    }}
                  >
                    {disabled === "added"
                      ? isEn ? "✓ Collected" : "✓ 已收集"
                      : disabled === "full"
                        ? isEn ? "Collection full" : "卡槽已满"
                        : isEn ? "Collect" : "收集"}
                  </button>
                  {/* 中文注释：跳过按钮 —— 用户不喜欢这张卡时点这个，
                      也会触发模型继续问下一个新方向，不会让对话戛然而止 */}
                  {disabled === "available" && (
                    <button
                      type="button"
                      onClick={() => onAcknowledgeCard(turn.card!, "skip")}
                      className="text-[11px] px-2.5 py-1 rounded-md text-white/55 hover:text-white/85 transition-colors"
                      style={{
                        fontFamily: "var(--font-label)",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.12)",
                      }}
                    >
                      {isEn ? "Skip" : "跳过"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

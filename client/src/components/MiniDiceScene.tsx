/*
 * MiniDiceScene — 彩蛋分支右侧的多骰子静态交互场景
 *
 * 三层结构：
 *  1. 装饰层（PLACEMENTS）：6 颗无内容、营造氛围的"野生骰子"，悬停可互相磁吸
 *  2. 锻造层（forge）：用户集齐 6 张卡后，点 CTA 触发四阶段合成动画
 *  3. 池子层（pool）：已合成的骰子持久化在 dicePool 中，每次进入彩蛋都能看见自己历史的骰子
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { SVGProps } from "react";
import * as LucideIcons from "lucide-react";
import { DICE_FACES } from "@/lib/diceData";
import { loadPool, subscribe } from "@/lib/dicePool";
import { addDiceSynced, flushPending } from "@/lib/diceSync";
import { FORGED_DICE_FACES, type ForgedDice } from "@shared/forgedDice";
import { TRAIT_CARD_TARGET_COUNT, type TraitCard } from "@shared/traitCard";

const renderIcon = (iconName: string, props: SVGProps<SVGSVGElement> & { className?: string }) => {
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent ? <IconComponent {...props} /> : <span className={props.className}>{iconName}</span>;
};

// 中文注释：装饰骰子上的抽象 logo —— 与人格特质语义共振
const TRAIT_ICONS: string[] = [
  "Compass",
  "Flame",
  "Gem",
  "Feather",
  "Sprout",
  "Atom",
];

// 中文注释：把"面索引"映射为立方体外层应当旋转到的角度
const FACE_VIEW_ROTATION: Record<number, { x: number; y: number }> = {
  0: { x: 0, y: 0 },
  1: { x: 0, y: 90 },
  2: { x: -90, y: 0 },
  3: { x: 90, y: 0 },
  4: { x: 0, y: -90 },
  5: { x: 0, y: 180 },
};

interface DicePlacement {
  id: number;
  size: number;
  initialFaceIndex: number;
  left: number; // %
  top: number; // %
  baseTiltX: number;
  baseTiltY: number;
  axisX: number;
  axisY: number;
}

const PLACEMENTS: DicePlacement[] = [
  { id: 0, size: 96, initialFaceIndex: 0, left: 22, top: 28, baseTiltX: -16, baseTiltY: 22, axisX: -0.7, axisY: -0.5 },
  { id: 1, size: 70, initialFaceIndex: 4, left: 60, top: 18, baseTiltX: -10, baseTiltY: -28, axisX: 0.4, axisY: -0.8 },
  { id: 2, size: 110, initialFaceIndex: 2, left: 78, top: 50, baseTiltX: -22, baseTiltY: 14, axisX: 0.9, axisY: 0 },
  { id: 3, size: 64, initialFaceIndex: 5, left: 18, top: 68, baseTiltX: -8, baseTiltY: -18, axisX: -0.8, axisY: 0.6 },
  { id: 4, size: 84, initialFaceIndex: 1, left: 48, top: 70, baseTiltX: -14, baseTiltY: 32, axisX: 0, axisY: 0.7 },
  { id: 5, size: 58, initialFaceIndex: 3, left: 42, top: 38, baseTiltX: -20, baseTiltY: -10, axisX: -0.1, axisY: -0.2 },
];

// 中文注释：池子骰子的散落位置 —— 用 id 哈希派生，保证每颗骰子位置稳定
function placementForPooledDice(id: string, index: number): { left: number; top: number; size: number; tiltX: number; tiltY: number } {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  const seed = (hash ^ (index * 2654435761)) >>> 0;
  const rand = (n: number) => ((seed >>> n) & 0xffff) / 0xffff;
  // 中文注释：在场景中部偏上区域散落，避开底部面板（底部预留 ~150px）
  const left = 12 + rand(0) * 76;
  const top = 8 + rand(4) * 48;
  const size = 56 + Math.floor(rand(8) * 36);
  const tiltX = -10 - Math.floor(rand(12) * 18);
  const tiltY = -30 + Math.floor(rand(16) * 60);
  return { left, top, size, tiltX, tiltY };
}

type ForgePhase = "idle" | "glow" | "assembling" | "settling";

interface MiniDiceSceneProps {
  accentColor: string;
  isEn?: boolean;
  collectedCards?: TraitCard[];
  /** 合成完成后通知父组件清空已收集的卡（开始新一轮收集） */
  onForgeComplete?: (dice: ForgedDice) => void;
}

function newDiceId(): string {
  return `dice_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function MiniDiceScene({
  accentColor,
  isEn = false,
  collectedCards = [],
  onForgeComplete,
}: MiniDiceSceneProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [faceByDice, setFaceByDice] = useState<Record<number, number>>(() =>
    PLACEMENTS.reduce((acc, p) => ({ ...acc, [p.id]: p.initialFaceIndex }), {} as Record<number, number>),
  );

  // 中文注释：从持久化层读骰子池，并订阅变化以便跨标签页同步
  const [pool, setPool] = useState<ForgedDice[]>(() => (typeof window === "undefined" ? [] : loadPool()));
  useEffect(() => {
    setPool(loadPool());
    // 中文注释：启动时把上次失败的远端推送补一次
    flushPending().catch(() => undefined);
    return subscribe(setPool);
  }, []);

  const clampedCollectedCards = collectedCards.slice(0, TRAIT_CARD_TARGET_COUNT);
  const collectedCount = clampedCollectedCards.length;
  const isForgeReady = collectedCount >= TRAIT_CARD_TARGET_COUNT;

  // 中文注释：合成动画状态机
  const [forgePhase, setForgePhase] = useState<ForgePhase>("idle");
  const forgeTimers = useRef<number[]>([]);
  useEffect(() => () => { forgeTimers.current.forEach((t) => window.clearTimeout(t)); }, []);

  const triggerForge = () => {
    if (!isForgeReady || forgePhase !== "idle") return;
    const dice: ForgedDice = {
      id: newDiceId(),
      cards: clampedCollectedCards as TraitCard[],
      forgedAt: Date.now(),
    };

    // glow → assembling → settling → 落入池子
    setForgePhase("glow");
    forgeTimers.current.push(window.setTimeout(() => setForgePhase("assembling"), 600));
    forgeTimers.current.push(
      window.setTimeout(() => setForgePhase("settling"), 600 + 800),
    );
    forgeTimers.current.push(
      window.setTimeout(() => {
        // 中文注释：本地立即写入 + 远端 best-effort（端点未配置时仅本地）
        addDiceSynced(dice).catch(() => undefined);
        onForgeComplete?.(dice);
        setForgePhase("idle");
      }, 600 + 800 + 500),
    );
  };

  const hoveredPlacement = useMemo(
    () => (hoveredId === null ? null : PLACEMENTS.find((p) => p.id === hoveredId) ?? null),
    [hoveredId],
  );

  const handleClick = (id: number) => {
    setFaceByDice((prev) => ({ ...prev, [id]: (prev[id] + 1) % DICE_FACES.length }));
  };

  return (
    <div
      className="relative w-full h-full"
      style={{ perspective: "1400px", perspectiveOrigin: "50% 45%" }}
    >
      {/* ============ 装饰层：野生骰子 ============ */}
      {PLACEMENTS.map((placement) => {
        const isHovered = hoveredId === placement.id;
        const isOtherHovered = hoveredId !== null && !isHovered;

        let leanX = 0;
        let leanY = 0;
        if (isOtherHovered && hoveredPlacement) {
          const dx = hoveredPlacement.axisX - placement.axisX;
          const dy = hoveredPlacement.axisY - placement.axisY;
          leanY = dx * 14;
          leanX = -dy * 14;
        }

        const faceIndex = faceByDice[placement.id];
        const targetView = FACE_VIEW_ROTATION[faceIndex] ?? FACE_VIEW_ROTATION[0];
        const rotateX = placement.baseTiltX + targetView.x + leanX;
        const rotateY = placement.baseTiltY + targetView.y + leanY;
        const scale = isHovered ? 1.12 : isOtherHovered ? 0.96 : 1;
        const halfSize = placement.size;

        return (
          <div
            key={placement.id}
            className="absolute"
            style={{
              left: `${placement.left}%`,
              top: `${placement.top}%`,
              width: placement.size * 2,
              height: placement.size * 2,
              transform: `translate(-50%, -50%) scale(${scale})`,
              transformStyle: "preserve-3d",
              transition: "transform 360ms cubic-bezier(0.22, 0.61, 0.36, 1)",
              zIndex: isHovered ? 30 : 10,
              cursor: "pointer",
            }}
            onMouseEnter={() => setHoveredId(placement.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => handleClick(placement.id)}
          >
            <div
              className="absolute pointer-events-none"
              style={{
                left: "50%",
                bottom: -placement.size * 0.35,
                width: placement.size * 1.6,
                height: placement.size * 0.5,
                transform: "translateX(-50%)",
                background:
                  "radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.18) 45%, transparent 70%)",
                filter: `blur(${placement.size * 0.18}px)`,
                opacity: isHovered ? 0.9 : 0.6,
                transition: "opacity 360ms ease",
              }}
            />

            <div
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                transformStyle: "preserve-3d",
                transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                transition: "transform 520ms cubic-bezier(0.22, 0.61, 0.36, 1)",
              }}
            >
              {DICE_FACES.map((face, i) => {
                const transforms = [
                  `translateZ(${halfSize}px)`,
                  `rotateY(-90deg) translateZ(${halfSize}px)`,
                  `rotateX(90deg) translateZ(${halfSize}px)`,
                  `rotateX(-90deg) translateZ(${halfSize}px)`,
                  `rotateY(90deg) translateZ(${halfSize}px)`,
                  `rotateY(180deg) translateZ(${halfSize}px)`,
                ];
                const r = parseInt(face.color.slice(1, 3), 16);
                const g = parseInt(face.color.slice(3, 5), 16);
                const b = parseInt(face.color.slice(5, 7), 16);

                return (
                  <div
                    key={face.id}
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      transform: transforms[i],
                      background:
                        "linear-gradient(135deg, rgba(20,20,25,0.95) 0%, rgba(12,12,16,0.98) 50%, rgba(8,8,10,1) 100%)",
                      border: `1px solid rgba(${r},${g},${b},0.45)`,
                      borderRadius: "14px",
                      boxShadow: `0 0 ${isHovered ? 28 : 16}px rgba(${r},${g},${b},${isHovered ? 0.35 : 0.18})`,
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      className="absolute rounded-full"
                      style={{
                        width: placement.size * 0.9,
                        height: placement.size * 0.9,
                        background: `radial-gradient(circle, rgba(${r},${g},${b},0.18) 0%, rgba(${r},${g},${b},0.05) 50%, transparent 75%)`,
                        filter: "blur(14px)",
                      }}
                    />
                    <span
                      style={{
                        color: face.color,
                        filter: `drop-shadow(0 0 10px rgba(${r},${g},${b},0.5))`,
                      }}
                    >
                      {renderIcon(TRAIT_ICONS[i] ?? face.icon, {
                        className: "",
                        width: placement.size * 0.5,
                        height: placement.size * 0.5,
                      } as any)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* ============ 池子层：已合成的骰子 ============ */}
      {pool.map((dice, index) => (
        <PooledDiceView
          key={dice.id}
          dice={dice}
          placement={placementForPooledDice(dice.id, index)}
          accentColor={accentColor}
          justSettled={forgePhase === "settling" && index === 0}
        />
      ))}

      {/* 中心氛围光 */}
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          left: "50%",
          top: "50%",
          width: "60%",
          height: "60%",
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(circle, ${accentColor}30 0%, ${accentColor}10 45%, transparent 75%)`,
          filter: "blur(40px)",
          zIndex: 0,
        }}
      />

      {/* ============ 锻造动画 overlay：assembling 阶段在场景中央显示放大的合成立方体 ============ */}
      {(forgePhase === "assembling" || forgePhase === "settling") && (
        <ForgeOverlay cards={clampedCollectedCards} accentColor={accentColor} phase={forgePhase} />
      )}

      {/* ============ 底部卡槽面板 ============ */}
      <div className="absolute inset-x-3 bottom-3 z-40">
        <div
          className="rounded-2xl border p-2.5 backdrop-blur-md"
          style={{
            borderColor: `${accentColor}28`,
            background: "rgba(4, 6, 18, 0.80)",
          }}
        >
          {/* 顶部进度行 */}
          <div className="flex items-center justify-between mb-2 px-0.5">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: TRAIT_CARD_TARGET_COUNT }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-500"
                  style={{
                    width: i < collectedCount ? 8 : 5,
                    height: i < collectedCount ? 8 : 5,
                    background: i < collectedCount
                      ? (clampedCollectedCards[i]?.color ?? accentColor)
                      : `${accentColor}28`,
                    boxShadow: i < collectedCount
                      ? `0 0 6px ${clampedCollectedCards[i]?.color ?? accentColor}80`
                      : "none",
                  }}
                />
              ))}
            </div>
            <div
              className="text-[10px] tracking-[0.2em] font-semibold"
              style={{ color: `${accentColor}88`, fontFamily: "var(--font-label)" }}
            >
              {collectedCount} / {TRAIT_CARD_TARGET_COUNT}
              {pool.length > 0 && (
                <span className="ml-2" style={{ color: `${accentColor}55` }}>
                  · {isEn ? "pool" : "池中"} {pool.length}
                </span>
              )}
            </div>
          </div>

          {/* 6 个卡槽 */}
          <div className="grid grid-cols-6 gap-1">
            {Array.from({ length: TRAIT_CARD_TARGET_COUNT }).map((_, i) => {
              const card = clampedCollectedCards[i];
              const isGlowing = forgePhase === "glow" && Boolean(card);
              const isHidden = forgePhase === "assembling" || forgePhase === "settling";
              return (
                <div
                  key={card?.id ?? `slot-${i}`}
                  className="h-8 w-8 justify-self-center rounded-lg flex items-center justify-center relative overflow-hidden transition-all duration-500"
                  title={card?.name}
                  style={
                    card
                      ? {
                          background: `linear-gradient(135deg, ${card.color}28, ${card.color}10)`,
                          border: `1px solid ${card.color}55`,
                          boxShadow: isGlowing
                            ? `0 0 20px ${card.color}cc, 0 0 40px ${card.color}66, inset 0 0 12px ${card.color}66`
                            : `0 0 12px ${card.color}22, inset 0 0 8px ${card.color}0C`,
                          transform: isHidden ? "scale(0.4) translateY(20px)" : isGlowing ? "scale(1.08)" : "scale(1)",
                          opacity: isHidden ? 0 : 1,
                        }
                      : {
                          background: "rgba(255,255,255,0.025)",
                          border: `1px dashed ${accentColor}22`,
                        }
                  }
                >
                  {card ? (
                    <>
                      <div
                        className="absolute inset-0"
                        style={{
                          background: `radial-gradient(circle at 40% 30%, ${card.color}35, transparent 70%)`,
                        }}
                      />
                      {renderIcon(card.icon, {
                        width: 14,
                        height: 14,
                        style: {
                          position: "relative",
                          color: card.color,
                          filter: `drop-shadow(0 0 6px ${card.color}90)`,
                        },
                      } as any)}
                    </>
                  ) : (
                    <div
                      className="w-1 h-1 rounded-full"
                      style={{ background: `${accentColor}28` }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* 集齐后的合成 CTA */}
          {isForgeReady && (
            <button
              type="button"
              onClick={triggerForge}
              disabled={forgePhase !== "idle"}
              className="mt-2.5 w-full rounded-xl px-3 py-2 flex items-center gap-3 transition-all duration-300 hover:brightness-125 disabled:opacity-60 disabled:cursor-wait group"
              style={{
                background: `linear-gradient(135deg, ${accentColor}28, ${accentColor}10)`,
                border: `1px solid ${accentColor}66`,
                boxShadow: `0 0 18px ${accentColor}22`,
              }}
            >
              <TraitForgeDice cards={clampedCollectedCards} spinning={forgePhase !== "idle"} />
              <div className="flex-1 min-w-0 text-left">
                <div
                  className="text-[11px] font-semibold tracking-wide leading-snug"
                  style={{ color: accentColor, fontFamily: "var(--font-label)" }}
                >
                  {forgePhase === "idle"
                    ? (isEn ? "✦ Forge your dice" : "✦ 合成你的骰子")
                    : (isEn ? "✦ Forging…" : "✦ 锻造中…")}
                </div>
                <div className="text-[10px] text-white/50 mt-0.5 leading-snug">
                  {isEn ? "6 traits — 1 unique die." : "6 张特质 · 1 颗专属骰子"}
                </div>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** 已经持久化在池中的骰子 —— 用 6 张卡的颜色和图标渲染 6 个面 */
function PooledDiceView({
  dice,
  placement,
  accentColor,
  justSettled,
}: {
  dice: ForgedDice;
  placement: { left: number; top: number; size: number; tiltX: number; tiltY: number };
  accentColor: string;
  justSettled: boolean;
}) {
  const halfSize = placement.size;
  const transforms = [
    `translateZ(${halfSize}px)`,
    `rotateY(-90deg) translateZ(${halfSize}px)`,
    `rotateX(90deg) translateZ(${halfSize}px)`,
    `rotateX(-90deg) translateZ(${halfSize}px)`,
    `rotateY(90deg) translateZ(${halfSize}px)`,
    `rotateY(180deg) translateZ(${halfSize}px)`,
  ];

  // 中文注释：刚落入池子时做一个"从天而降"的小动画
  const [landed, setLanded] = useState(!justSettled);
  useEffect(() => {
    if (justSettled) {
      const t = window.setTimeout(() => setLanded(true), 30);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [justSettled]);

  return (
    <div
      className="absolute group"
      style={{
        left: `${placement.left}%`,
        top: `${placement.top}%`,
        width: placement.size * 2,
        height: placement.size * 2,
        transform: `translate(-50%, -50%) scale(${landed ? 1 : 0.2}) translateY(${landed ? 0 : -60}px)`,
        opacity: landed ? 1 : 0,
        transformStyle: "preserve-3d",
        transition: "transform 600ms cubic-bezier(0.22, 1.2, 0.36, 1), opacity 600ms ease",
        zIndex: 25,
      }}
      title={dice.cards.map((c) => c.name).join(" · ")}
    >
      <div
        className="absolute pointer-events-none"
        style={{
          left: "50%",
          bottom: -placement.size * 0.32,
          width: placement.size * 1.4,
          height: placement.size * 0.45,
          transform: "translateX(-50%)",
          background: `radial-gradient(ellipse, ${accentColor}55 0%, ${accentColor}18 45%, transparent 70%)`,
          filter: `blur(${placement.size * 0.18}px)`,
          opacity: 0.7,
        }}
      />
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
          transform: `rotateX(${placement.tiltX}deg) rotateY(${placement.tiltY}deg)`,
          transition: "transform 700ms ease",
        }}
        className="group-hover:[transform:rotateX(-12deg)_rotateY(45deg)]"
      >
        {Array.from({ length: FORGED_DICE_FACES }).map((_, i) => {
          const card = dice.cards[i];
          const color = card?.color ?? "#888888";
          const r = parseInt(color.slice(1, 3), 16);
          const g = parseInt(color.slice(3, 5), 16);
          const b = parseInt(color.slice(5, 7), 16);
          return (
            <div
              key={i}
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: transforms[i],
                background:
                  "linear-gradient(135deg, rgba(20,20,25,0.96) 0%, rgba(12,12,16,0.98) 50%, rgba(8,8,10,1) 100%)",
                border: `1px solid rgba(${r},${g},${b},0.55)`,
                borderRadius: "14px",
                boxShadow: `0 0 18px rgba(${r},${g},${b},0.28)`,
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                overflow: "hidden",
              }}
            >
              <div
                className="absolute rounded-full"
                style={{
                  width: placement.size * 0.9,
                  height: placement.size * 0.9,
                  background: `radial-gradient(circle, rgba(${r},${g},${b},0.22) 0%, rgba(${r},${g},${b},0.06) 50%, transparent 75%)`,
                  filter: "blur(14px)",
                }}
              />
              {/* 中文注释：合成后的骰子保留文字 —— icon 居上 + 卡名居下 */}
              {card && (
                <div className="relative flex flex-col items-center justify-center gap-1 px-1 text-center">
                  {renderIcon(card.icon, {
                    width: placement.size * 0.42,
                    height: placement.size * 0.42,
                    style: { color, filter: `drop-shadow(0 0 8px rgba(${r},${g},${b},0.6))` },
                  } as any)}
                  <span
                    style={{
                      color,
                      fontSize: Math.max(9, placement.size * 0.13),
                      fontWeight: 600,
                      letterSpacing: "0.02em",
                      textShadow: `0 0 6px rgba(${r},${g},${b},0.55)`,
                      lineHeight: 1.05,
                      maxWidth: placement.size * 1.6,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontFamily: "var(--font-label, inherit)",
                    }}
                  >
                    {card.name}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** 锻造中央动画 —— 一颗在屏幕中心高速旋转的大立方体 */
function ForgeOverlay({
  cards,
  accentColor,
  phase,
}: {
  cards: TraitCard[];
  accentColor: string;
  phase: "assembling" | "settling";
}) {
  const size = 90;
  const halfSize = size;
  const transforms = [
    `translateZ(${halfSize}px)`,
    `rotateY(-90deg) translateZ(${halfSize}px)`,
    `rotateX(90deg) translateZ(${halfSize}px)`,
    `rotateX(-90deg) translateZ(${halfSize}px)`,
    `rotateY(90deg) translateZ(${halfSize}px)`,
    `rotateY(180deg) translateZ(${halfSize}px)`,
  ];

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: "50%",
        top: "44%",
        width: size * 2,
        height: size * 2,
        transform: `translate(-50%, -50%) scale(${phase === "settling" ? 0.35 : 1})`,
        opacity: phase === "settling" ? 0 : 1,
        transformStyle: "preserve-3d",
        transition: "transform 500ms cubic-bezier(0.6, -0.2, 0.4, 1), opacity 500ms ease",
        zIndex: 50,
      }}
    >
      {/* 光环 */}
      <div
        className="absolute rounded-full"
        style={{
          left: "50%",
          top: "50%",
          width: size * 3.6,
          height: size * 3.6,
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(circle, ${accentColor}55 0%, ${accentColor}22 30%, transparent 65%)`,
          filter: "blur(28px)",
          animation: "pulse 1.4s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
          animation: phase === "assembling" ? "forge-spin 1.2s linear infinite" : undefined,
        }}
      >
        {Array.from({ length: FORGED_DICE_FACES }).map((_, i) => {
          const card = cards[i];
          const color = card?.color ?? accentColor;
          const r = parseInt(color.slice(1, 3), 16);
          const g = parseInt(color.slice(3, 5), 16);
          const b = parseInt(color.slice(5, 7), 16);
          return (
            <div
              key={i}
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: transforms[i],
                background:
                  "linear-gradient(135deg, rgba(20,20,25,0.96) 0%, rgba(12,12,16,0.98) 50%, rgba(8,8,10,1) 100%)",
                border: `1px solid rgba(${r},${g},${b},0.85)`,
                borderRadius: "16px",
                boxShadow: `0 0 32px rgba(${r},${g},${b},0.65), inset 0 0 20px rgba(${r},${g},${b},0.25)`,
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                overflow: "hidden",
              }}
            >
              {card && (
                <div className="flex flex-col items-center justify-center gap-1 px-1 text-center">
                  {renderIcon(card.icon, {
                    width: size * 0.45,
                    height: size * 0.45,
                    style: { color, filter: `drop-shadow(0 0 14px rgba(${r},${g},${b},0.85))` },
                  } as any)}
                  <span
                    style={{
                      color,
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: "0.02em",
                      textShadow: `0 0 8px rgba(${r},${g},${b},0.85)`,
                      lineHeight: 1.05,
                      maxWidth: size * 1.6,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontFamily: "var(--font-label, inherit)",
                    }}
                  >
                    {card.name}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes forge-spin {
          0%   { transform: rotateX(-15deg) rotateY(0deg); }
          100% { transform: rotateX(-15deg) rotateY(360deg); }
        }
      `}</style>
    </div>
  );
}

/** CTA 左侧的小立方体预览 */
function TraitForgeDice({ cards, spinning }: { cards: TraitCard[]; spinning: boolean }) {
  const cubeSize = 36;
  const halfSize = cubeSize;
  const transforms = [
    `translateZ(${halfSize}px)`,
    `rotateY(-90deg) translateZ(${halfSize}px)`,
    `rotateX(90deg) translateZ(${halfSize}px)`,
    `rotateX(-90deg) translateZ(${halfSize}px)`,
    `rotateY(90deg) translateZ(${halfSize}px)`,
    `rotateY(180deg) translateZ(${halfSize}px)`,
  ];

  return (
    <div className="shrink-0" style={{ width: cubeSize * 2, height: cubeSize * 2, perspective: "1000px" }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          transformStyle: "preserve-3d",
          transform: "rotateX(-18deg) rotateY(28deg)",
          animation: spinning ? "forge-spin-mini 1.6s linear infinite" : undefined,
        }}
      >
        {Array.from({ length: TRAIT_CARD_TARGET_COUNT }).map((_, index) => {
          const fallbackFace = DICE_FACES[index];
          const card = cards[index];
          const color = card?.color ?? fallbackFace.color;
          const icon = card?.icon ?? fallbackFace.icon;
          const r = parseInt(color.slice(1, 3), 16);
          const g = parseInt(color.slice(3, 5), 16);
          const b = parseInt(color.slice(5, 7), 16);

          return (
            <div
              key={`forge-face-${index}`}
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: transforms[index],
                background: "linear-gradient(135deg, rgba(18,18,24,0.97), rgba(8,8,12,1))",
                border: `1px solid rgba(${r},${g},${b},0.62)`,
                borderRadius: "10px",
                boxShadow: `0 0 14px rgba(${r},${g},${b},0.25)`,
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
            >
              <span style={{ color, filter: `drop-shadow(0 0 8px rgba(${r},${g},${b},0.5))` }}>
                {renderIcon(icon, { width: 16, height: 16 } as any)}
              </span>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes forge-spin-mini {
          0%   { transform: rotateX(-18deg) rotateY(0deg); }
          100% { transform: rotateX(-18deg) rotateY(360deg); }
        }
      `}</style>
    </div>
  );
}

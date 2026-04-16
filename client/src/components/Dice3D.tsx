/*
 * 3D Dice — 高级版本
 * 更精致的材质、光影和动画效果
 */

import { useState, useRef, useCallback, useEffect } from "react";
import type { SVGProps, TransitionEvent } from "react";
import * as LucideIcons from "lucide-react";
import { DICE_FACES } from "@/lib/diceData";
import {
  buildSpinRotation,
  getSpinDurationMs,
  randomFaceId,
  SPIN_CONFIG,
  type SpinMode,
} from "@/lib/diceEngine";

// 图标渲染辅助函数
const renderIcon = (iconName: string, props: SVGProps<SVGSVGElement> & { className?: string }) => {
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent ? <IconComponent {...props} /> : <span className={props.className}>{iconName}</span>;
};

interface Dice3DProps {
  onFaceSelected: (faceId: number) => void;
  isRolling: boolean;
  onRollStart: () => void;
  onTargetFaceSettled?: () => void;
  targetFace?: number;
  activeColor?: string;
  performanceMode?: "full" | "lite";
}

const IDLE_RESUME_DELAY_MS = 300;
const SPIN_END_FALLBACK_MS = 80;

interface SpinState {
  id: number;
  faceId: number;
  mode: SpinMode;
  completed: boolean;
}

export default function Dice3D({
  onFaceSelected,
  isRolling,
  onRollStart,
  onTargetFaceSettled,
  targetFace,
  activeColor,
  performanceMode = "full",
}: Dice3DProps) {
  // 中文注释：lite 模式用于移动端性能优化，减少实时重绘和重型滤镜开销。
  const isLiteMode = performanceMode === "lite";
  const cubeSize = "clamp(46.8px, 6.48vw, 75.6px)";
  const cubeRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: -20, y: 25 });
  const [spinDurationMs, setSpinDurationMs] = useState(SPIN_CONFIG.fastDurationMs);
  const [isIdle, setIsIdle] = useState(true);
  const idleRef = useRef<number>(0);
  const spinEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spinStateRef = useRef<SpinState | null>(null);
  const finishSpinRef = useRef<(spinId: number) => void>(() => undefined);
  const spinQueueRef = useRef<number[]>([]);
  const isSpinningRef = useRef(false);
  const shouldResumeIdleRef = useRef(true);

  // Idle 悬浮动画
  useEffect(() => {
    if (isLiteMode) return;
    if (!isIdle || isRolling) return;
    let t = 0;
    const baseX = -20;
    const baseY = 25;
    const animate = () => {
      t += 0.005;
      setRotation({
        x: baseX + Math.sin(t * 0.8) * 5,
        y: baseY + Math.sin(t * 1.2) * 6,
      });
      idleRef.current = requestAnimationFrame(animate);
    };
    idleRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(idleRef.current);
  }, [isIdle, isLiteMode, isRolling]);

  const clearSpinEndTimeout = useCallback(() => {
    if (spinEndTimeoutRef.current) {
      clearTimeout(spinEndTimeoutRef.current);
      spinEndTimeoutRef.current = null;
    }
  }, []);

  const startSpin = useCallback(
    (faceId: number, mode: SpinMode) => {
      setIsIdle(false);
      cancelAnimationFrame(idleRef.current);
      clearSpinEndTimeout();

      isSpinningRef.current = true;
      shouldResumeIdleRef.current = mode === "random";

      const durationMs = getSpinDurationMs(mode, SPIN_CONFIG);
      setSpinDurationMs(durationMs);

      const finalRotation = buildSpinRotation(faceId, mode, SPIN_CONFIG);
      const spinId = Date.now() + Math.random();

      spinStateRef.current = {
        id: spinId,
        faceId,
        mode,
        completed: false,
      };

      setRotation(finalRotation);
      spinEndTimeoutRef.current = setTimeout(
        () => finishSpinRef.current(spinId),
        durationMs + SPIN_END_FALLBACK_MS
      );
    },
    [clearSpinEndTimeout]
  );

  const finishSpin = useCallback(
    (spinId: number) => {
      const currentSpin = spinStateRef.current;
      if (!currentSpin || currentSpin.id !== spinId || currentSpin.completed) return;

      currentSpin.completed = true;
      spinStateRef.current = null;
      isSpinningRef.current = false;
      clearSpinEndTimeout();

      if (currentSpin.mode === "random") {
        // 随机滚动结束后清空队列，避免历史请求串入
        spinQueueRef.current = [];
        onFaceSelected(currentSpin.faceId);
        return;
      }

      // 目标面滚动只保留最新请求，按顺序消费
      if (spinQueueRef.current.length > 0) {
        const nextFaceId = spinQueueRef.current[spinQueueRef.current.length - 1];
        spinQueueRef.current = [];
        startSpin(nextFaceId, "target");
        return;
      }

      onTargetFaceSettled?.();
    },
    [clearSpinEndTimeout, onFaceSelected, onTargetFaceSettled, startSpin]
  );

  useEffect(() => {
    finishSpinRef.current = finishSpin;
  }, [finishSpin]);

  const requestTargetSpin = useCallback(
    (faceId: number) => {
      const currentSpin = spinStateRef.current;
      // 快档随机滚动期间忽略标签请求，避免与随机揭示流程冲突
      if (currentSpin?.mode === "random") return;

      if (!isSpinningRef.current) {
        startSpin(faceId, "target");
        return;
      }

      // 队列只保留最新目标，防止快速点击产生过多排队
      spinQueueRef.current = [faceId];
    },
    [startSpin]
  );

  const roll = useCallback(() => {
    if (isRolling || isSpinningRef.current) return;
    onRollStart();
    spinQueueRef.current = [];
    const selectedFace = randomFaceId(DICE_FACES.length);
    startSpin(selectedFace, "random");
  }, [isRolling, onRollStart, startSpin]);

  // 标签切换时联动骰子旋转到对应面（不触发详情弹层）
  useEffect(() => {
    if (!targetFace) return;
    requestTargetSpin(targetFace);
  }, [requestTargetSpin, targetFace]);

  const handleCubeTransitionEnd = useCallback(
    (event: TransitionEvent<HTMLDivElement>) => {
      if (event.target !== cubeRef.current || event.propertyName !== "transform") return;
      const currentSpin = spinStateRef.current;
      if (!currentSpin) return;
      finishSpinRef.current(currentSpin.id);
    },
    []
  );

  useEffect(() => {
    return () => {
      cancelAnimationFrame(idleRef.current);
      clearSpinEndTimeout();
      spinQueueRef.current = [];
      isSpinningRef.current = false;
      spinStateRef.current = null;
    };
  }, [clearSpinEndTimeout]);

  useEffect(() => {
    if (!isRolling) {
      if (isLiteMode) {
        setIsIdle(false);
        return;
      }
      if (!shouldResumeIdleRef.current) {
        setIsIdle(false);
        return;
      }
      const timer = setTimeout(() => {
        setIsIdle(true);
      }, IDLE_RESUME_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [isLiteMode, isRolling]);

  return (
    <div className="flex flex-col items-center select-none gap-10">
      {/* 3D 场景 */}
      <div
        className="relative group"
        style={{
          perspective: "1200px",
          perspectiveOrigin: "50% 50%",
        }}
      >
        {/* 背景光晕 - 更强烈 */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-all duration-1000"
          style={{
            width: isLiteMode ? (isRolling ? "360px" : "320px") : isRolling ? "600px" : "500px",
            height: isLiteMode ? (isRolling ? "360px" : "320px") : isRolling ? "600px" : "500px",
            background: isRolling
              ? isLiteMode
                ? "radial-gradient(circle, rgba(139,92,246,0.08) 0%, rgba(244,114,182,0.04) 40%, transparent 70%)"
                : "radial-gradient(circle, rgba(139,92,246,0.12) 0%, rgba(244,114,182,0.065) 40%, transparent 70%)"
              : isLiteMode
                ? "radial-gradient(circle, rgba(139,92,246,0.045) 0%, rgba(244,114,182,0.02) 40%, transparent 70%)"
                : "radial-gradient(circle, rgba(139,92,246,0.065) 0%, rgba(244,114,182,0.032) 40%, transparent 70%)",
            filter: `blur(${isLiteMode ? (isRolling ? 34 : 26) : isRolling ? 60 : 50}px)`,
          }}
        />

        {/* 特定页面的彩色光晕 */}
        {activeColor && !isRolling && !isLiteMode && (
          <div
            key={activeColor}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
            style={{
              width: "550px",
              height: "550px",
              background: `radial-gradient(circle, ${activeColor}60 0%, ${activeColor}32 35%, transparent 65%)`,
              filter: "blur(50px)",
              willChange: "opacity",
              animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }}
          />
        )}

        {/* 地面阴影 */}
        <div
          className="absolute left-1/2 -translate-x-1/2 pointer-events-none transition-all duration-700"
          style={{
            bottom: "-60px",
            width: isLiteMode ? (isRolling ? "140px" : "190px") : isRolling ? "180px" : "280px",
            height: isLiteMode ? "64px" : "80px",
            background: "radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 40%, transparent 70%)",
            filter: `blur(${isLiteMode ? 16 : 25}px)`,
            opacity: isRolling ? 0.4 : isLiteMode ? 0.62 : 0.8,
          }}
        />

        {/* 骰子容器 */}
        <div
          className="cursor-pointer hover:scale-[1.02] transition-transform duration-300"
          onClick={roll}
          style={{
            width: `calc(${cubeSize} * 2.2)`,
            height: `calc(${cubeSize} * 2.2)`,
            transformStyle: "preserve-3d",
            willChange: "transform",
          }}
        >
          {/* 骰子立方体 */}
          <div
            ref={cubeRef}
            onTransitionEnd={handleCubeTransitionEnd}
            style={{
              width: "100%",
              height: "100%",
              transformStyle: "preserve-3d",
              transform: `translateZ(0) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
              transition: isRolling
                ? `transform ${spinDurationMs}ms cubic-bezier(0.12, 0.84, 0.2, 1)`
                : "none",
              willChange: "transform",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            {DICE_FACES.map((face, i) => {
              const transforms = [
                `translateZ(${cubeSize})`,
                `rotateY(-90deg) translateZ(${cubeSize})`,
                `rotateX(90deg) translateZ(${cubeSize})`,
                `rotateX(-90deg) translateZ(${cubeSize})`,
                `rotateY(90deg) translateZ(${cubeSize})`,
                `rotateY(180deg) translateZ(${cubeSize})`,
              ];

              const r = parseInt(face.color.slice(1, 3), 16);
              const g = parseInt(face.color.slice(3, 5), 16);
              const b = parseInt(face.color.slice(5, 7), 16);

              const glowBoost = isRolling ? 2 : 1;

              return (
                <div
                  key={face.id}
                  className={`absolute inset-0 flex flex-col items-center justify-center gap-2 ${
                    isRolling || isLiteMode ? "" : "backdrop-blur-sm"
                  }`}
                  style={{
                    transform: transforms[i],
                    background: `linear-gradient(135deg, rgba(20,20,25,0.95) 0%, rgba(12,12,16,0.98) 50%, rgba(8,8,10,1) 100%)`,
                    border: `1px solid rgba(${r},${g},${b},${0.42 * glowBoost})`,
                    borderRadius: "16px",
                    boxShadow: `0 0 20px rgba(${r},${g},${b},${0.16 * glowBoost})`,
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transformStyle: "preserve-3d",
                    willChange: "transform",
                    overflow: "hidden",
                  }}
                >
                  {/* 角标编号 */}
                  <div
                    className="absolute top-4 left-4 text-xs font-bold tracking-wider"
                    style={{
                      fontFamily: "var(--font-label)",
                      color: `rgba(${r},${g},${b},0.42)`,
                      textShadow: `0 0 10px rgba(${r},${g},${b},0.24)`,
                    }}
                  >
                    {String(face.id).padStart(2, "0")}
                  </div>

                  {/* 中心光效 */}
                  <div className="relative flex items-center justify-center">
                    <div
                      className={`absolute rounded-full ${isLiteMode ? "" : "animate-pulse"}`}
                      style={{
                        width: isLiteMode ? "72px" : "90px",
                        height: isLiteMode ? "72px" : "90px",
                        background: `radial-gradient(circle, rgba(${r},${g},${b},${isLiteMode ? 0.1 : 0.16}) 0%, rgba(${r},${g},${b},${isLiteMode ? 0.03 : 0.04}) 50%, transparent 70%)`,
                        filter: `blur(${isLiteMode ? 12 : 20}px)`,
                      }}
                    />
                    <span
                      className="relative text-4xl sm:text-5xl md:text-6xl"
                      style={{
                        color: face.color,
                        filter: isLiteMode
                          ? `drop-shadow(0 0 8px rgba(${r},${g},${b},0.36))`
                          : `drop-shadow(0 0 15px rgba(${r},${g},${b},0.5)) drop-shadow(0 0 30px rgba(${r},${g},${b},0.24))`,
                      }}
                    >
                      {renderIcon(face.icon, { className: "w-10 h-10" })}
                    </span>
                  </div>

                  {/* 副标题 */}
                  <span
                    className="text-[9px] sm:text-[10px] tracking-[0.4em] uppercase font-medium"
                    style={{
                      fontFamily: "var(--font-label)",
                      color: `rgba(${r},${g},${b},0.62)`,
                      textShadow: `0 0 8px rgba(${r},${g},${b},0.32)`,
                    }}
                  >
                    {face.subtitle}
                  </span>

                  {/* 底部装饰线 */}
                  <div
                    className="absolute bottom-0 left-[15%] right-[15%] h-[2px]"
                    style={{
                      background: `linear-gradient(90deg, transparent, rgba(${r},${g},${b},0.24), transparent)`,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 投掷按钮 */}
      
    </div>
  );
}

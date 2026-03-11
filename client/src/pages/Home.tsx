import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Github, Mail } from "lucide-react";
import Dice3D from "@/components/Dice3D";
import DimensionPanel from "@/components/DimensionPanel";
import ParticleField from "@/components/ParticleField";
import { DICE_FACES } from "@/lib/diceData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function WechatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M8.2 4C4.2 4 1 6.7 1 10c0 1.9 1 3.6 2.6 4.7L3 18l3.1-1.6c.7.2 1.4.3 2.1.3 4 0 7.2-2.7 7.2-6s-3.2-6-7.2-6Zm-3 5.2a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm6 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" />
      <path d="M15.8 9.3c-3 0-5.5 2-5.5 4.5s2.5 4.5 5.5 4.5c.6 0 1.2-.1 1.8-.3l2.4 1.2-.5-2.4c1.2-.8 1.9-1.9 1.9-3.1 0-2.5-2.5-4.4-5.6-4.4Zm-2.3 3.8a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6Zm4.5 0a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6Z" />
    </svg>
  );
}

export default function App() {
  const HOME_FUTURE_COLOR = "#F7EFA9";
  const [isRolling, setIsRolling] = useState(false);
  const [selectedFace, setSelectedFace] = useState<number | null>(null);
  const [showDimension, setShowDimension] = useState(false);
  const [activeTab, setActiveTab] = useState(String(DICE_FACES[0].id));
  const [targetFace, setTargetFace] = useState<number | undefined>(undefined);
  const [toast, setToast] = useState<string | null>(null);
  const [toastPosition, setToastPosition] = useState({ x: 24, y: 24 });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const placeToastNearPointer = useCallback((clientX: number, clientY: number) => {
    if (typeof window === "undefined") return;
    const offset = 16;
    const minX = 12;
    const minY = 12;
    const maxX = Math.max(minX, window.innerWidth - 360);
    const maxY = Math.max(minY, window.innerHeight - 80);
    setToastPosition({
      x: Math.min(maxX, Math.max(minX, clientX + offset)),
      y: Math.min(maxY, Math.max(minY, clientY + offset)),
    });
  }, []);

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(null), 2500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const handleMouseMove = (event: MouseEvent) => {
      placeToastNearPointer(event.clientX, event.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [toast, placeToastNearPointer]);

  const copyToClipboard = useCallback(async (text: string, label: string, event?: ReactMouseEvent<HTMLButtonElement>) => {
    if (event) {
      placeToastNearPointer(event.clientX, event.clientY);
    }
    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const copied = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (!copied) {
          throw new Error("copy_failed");
        }
      }
      showToast(`${label} 已复制到剪贴板`);
    } catch {
      showToast("复制失败，请手动复制");
    }
  }, [placeToastNearPointer, showToast]);

  const activeFace = useMemo(
    () => DICE_FACES.find((face) => String(face.id) === activeTab) ?? DICE_FACES[0],
    [activeTab]
  );
  const getHomeFaceColor = (faceId: number, color: string) =>
    faceId === 6 ? HOME_FUTURE_COLOR : color;
  const activeHomeColor = getHomeFaceColor(activeFace.id, activeFace.color);

  const handleRollStart = useCallback(() => {
    setIsRolling(true);
    setShowDimension(false);
    setSelectedFace(null);
    setTargetFace(undefined); // 清除目标面，让骰子随机滚动
  }, []);

  const handleFaceSelected = useCallback((faceId: number) => {
    setActiveTab(String(faceId));
    setSelectedFace(faceId);
    setTimeout(() => {
      setShowDimension(true);
      setIsRolling(false);
    }, 500);
  }, []);

  const handleTargetFaceSettled = useCallback(() => {
    setTargetFace(undefined);
    setIsRolling(false);
  }, []);

  const handleRerollFromPanel = useCallback((nextFaceId: number) => {
    setActiveTab(String(nextFaceId));
    setSelectedFace(nextFaceId);
    setShowDimension(true);
    setIsRolling(false);
    setTargetFace(undefined);
  }, []);

  const handleNavigateFromPanel = useCallback((nextFaceId: number) => {
    setActiveTab(String(nextFaceId));
    setSelectedFace(nextFaceId);
    setShowDimension(true);
    setIsRolling(false);
    setTargetFace(undefined);
  }, []);

  const handleCloseDimension = useCallback(() => {
    setShowDimension(false);
    setSelectedFace(null);
  }, []);

  const handleOpenCurrentTab = useCallback(() => {
    setSelectedFace(activeFace.id);
    setShowDimension(true);
    setIsRolling(false);
  }, [activeFace.id]);

  // 监听标签切换，立即更新 activeTab，然后触发骰子旋转
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value); // 立即更新标签状态，不等骰子动画
    const faceId = parseInt(value);
    if (!isRolling && !showDimension) {
      setTargetFace(faceId);
      setIsRolling(true);
    }
  }, [isRolling, showDimension]);

  return (
    <div className="h-screen bg-black relative overflow-hidden">
      <ParticleField />

      {/* 用轻量叠层提亮，避免整屏 filter 触发昂贵重采样 */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, rgba(255,255,255,0.06), transparent 65%)",
        }}
      />

      {/* 背景装饰渐变 */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div 
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #4A7BF7, transparent)" }}
        />
        <div 
          className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #F472B6, transparent)" }}
        />
      </div>

      <div
        className="relative z-10 h-screen flex flex-col items-center justify-center px-4 py-4 overflow-hidden"
        style={{ transform: "translate(0px, 44px)" }}
      >
        
        {/* 顶部品牌标识 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: showDimension ? 0 : 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute -top-[52px] md:-top-[48px] left-1/2 -translate-x-1/2 origin-top"
        >
          <div style={{ transform: "translate(7px, 0px)" }}>
            <span
              className="text-xs tracking-[0.6em] text-white/15 uppercase font-bold"
              style={{ fontFamily: "var(--font-label)" }}
            >
              SUPER INDIVIDUAL
            </span>
          </div>
        </motion.div>

        {/* 主标题区域 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={showDimension ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="absolute top-2/3 left-0 right-0 z-20 h-[clamp(200px,32vw,380px)] w-full text-center pointer-events-none -translate-y-1/2"
        >
          <div
            className="absolute left-1/2 top-2/3 w-fit"
            style={{
              transform: "translate(-50%, -50%) translate(-105px, -212px)",
            }}
          >
            <motion.div
              className="pointer-events-none absolute -inset-[10%] rounded-full blur-[44px] mix-blend-screen transform-gpu"
              style={{
                background:
                  "conic-gradient(from 0deg, rgba(78,205,196,0.23), rgba(74,123,247,0.27), rgba(168,85,247,0.22), rgba(244,114,182,0.24), rgba(255,217,61,0.22), rgba(78,205,196,0.23))",
                willChange: "transform, opacity",
              }}
              animate={{
                rotate: [0, 360],
                scale: [1, 1.08, 1],
                opacity: [0.31, 0.46, 0.31],
              }}
              transition={{
                duration: 14,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <motion.div
              className="pointer-events-none absolute -inset-[14%] rounded-full blur-[60px] mix-blend-screen transform-gpu"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, rgba(74,123,247,0.27), transparent 48%), radial-gradient(circle at 75% 35%, rgba(78,205,196,0.24), transparent 50%), radial-gradient(circle at 50% 75%, rgba(244,114,182,0.27), transparent 52%)",
                willChange: "transform, opacity",
              }}
              animate={{
                rotate: [360, 0],
                scale: [1.02, 1.12, 1.02],
                opacity: [0.255, 0.37, 0.255],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="pointer-events-none absolute -inset-[20%] rounded-full blur-[74px] mix-blend-screen transform-gpu"
              style={{
                background:
                  "radial-gradient(circle at 20% 50%, rgba(78,205,196,0.24), transparent 46%), radial-gradient(circle at 80% 45%, rgba(168,85,247,0.24), transparent 48%), radial-gradient(circle at 50% 80%, rgba(255,217,61,0.20), transparent 52%)",
                willChange: "transform, opacity",
              }}
              animate={{
                rotate: [0, 180, 360],
                scale: [1, 1.06, 1],
                opacity: [0.18, 0.30, 0.18],
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <img
              src="/Mountion.png"
              alt="Mountion"
              className="relative block h-auto w-[min(67.5vw,882px)]"
              style={{ transform: "scale(1.13)", transformOrigin: "center" }}
            />
            <div className="absolute left-full ml-3 md:ml-4 top-1/2 -translate-y-1/2 pointer-events-auto z-30">
              <div
                className="flex items-center gap-2"
                style={{ transform: "translate(162px, -38px)" }}
              >
                <button
                  type="button"
                  title="微信"
                  aria-label="微信"
                  onClick={(event) => copyToClipboard("JaneZ_0831", "微信号 JaneZ_0831", event)}
                  className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full bg-black text-white
                             transition-all duration-200 hover:scale-105"
                  style={{
                    color: "rgba(196, 181, 253, 0.95)",
                    boxShadow: "0 0 14px rgba(168, 85, 247, 0.26)",
                  }}
                >
                  <WechatIcon className="h-[18px] w-[18px]" />
                </button>
                <button
                  type="button"
                  title="GitHub"
                  aria-label="GitHub"
                  onClick={(event) => copyToClipboard("https://github.com/mountionzeng", "GitHub https://github.com/mountionzeng", event)}
                  className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full bg-black text-white
                             transition-all duration-200 hover:scale-105"
                  style={{
                    color: "rgba(180, 164, 255, 0.95)",
                    boxShadow: "0 0 14px rgba(147, 51, 234, 0.28)",
                  }}
                >
                  <Github className="h-[18px] w-[18px]" />
                </button>
                <button
                  type="button"
                  title="邮箱"
                  aria-label="邮箱"
                  onClick={(event) => copyToClipboard("13261038583@163.com", "邮箱 13261038583@163.com", event)}
                  className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full bg-black text-white
                             transition-all duration-200 hover:scale-105"
                  style={{
                    color: "rgba(216, 180, 254, 0.95)",
                    boxShadow: "0 0 14px rgba(126, 34, 206, 0.28)",
                  }}
                >
                  <Mail className="h-[18px] w-[18px]" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 标签和卡片容器 */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: showDimension ? 0 : 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-7xl mt-1 md:mt-2 translate-y-[98px] md:translate-y-[104px] relative origin-top"
        >
          <div style={{ transform: "translate(6px, 0px)" }}>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col">
            {/* 标签栏 - 在卡片外面 */}
            <div className="relative -mt-[20px] mb-0">
              <div
                className="pointer-events-none absolute inset-x-0 -inset-y-3 rounded-2xl blur-2xl opacity-100"
                style={{
                  background: `radial-gradient(ellipse at center, ${activeHomeColor}92 0%, ${activeHomeColor}40 42%, transparent 74%)`,
                }}
              />
              <motion.div
                className="pointer-events-none absolute inset-0 rounded-2xl mix-blend-screen"
                style={{
                  background:
                    "linear-gradient(110deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.22) 35%, rgba(255,255,255,0.08) 60%, rgba(255,255,255,0.03) 100%)",
                }}
                animate={{
                  x: ["-12%", "12%", "-12%"],
                  opacity: [0.16, 0.26, 0.16],
                }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <TabsList className="relative z-10 h-auto w-full grid grid-cols-3 md:grid-cols-6 gap-0 rounded-2xl bg-black/[0.78] border border-white/20 p-[2px] mb-0 backdrop-blur-xl shadow-[0_0_36px_rgba(0,0,0,0.45)]">
                {DICE_FACES.map((face) => {
                  const homeColor = getHomeFaceColor(face.id, face.color);
                  return (
                    <TabsTrigger
                      key={face.id}
                      value={String(face.id)}
                      className="h-full min-h-[52px] md:min-h-[58px] relative rounded-xl border border-white/22 px-2 py-1 text-[20px] md:text-[22px] leading-snug font-extrabold text-white text-center whitespace-normal
                                 data-[state=active]:text-white data-[state=active]:bg-white/[0.22] data-[state=active]:border-white/70
                                 hover:bg-white/[0.14] transition-all duration-150 cursor-pointer z-10"
                      style={{
                        color:
                          activeTab === String(face.id)
                            ? `color-mix(in srgb, ${homeColor} 70%, #ffffff)`
                            : "#ffffff",
                        background:
                          activeTab === String(face.id)
                            ? `linear-gradient(135deg, ${homeColor}66, rgba(16,16,22,0.88))`
                            : undefined,
                        boxShadow:
                          activeTab === String(face.id)
                            ? `0 0 52px ${homeColor}a8, inset 0 0 34px ${homeColor}55`
                            : "inset 0 0 18px rgba(255,255,255,0.08)",
                        textShadow:
                          activeTab === String(face.id)
                            ? `0 0 10px rgba(255,255,255,0.9), 0 0 24px ${homeColor}cc`
                            : "0 0 14px rgba(255,255,255,0.65)",
                        filter:
                          activeTab === String(face.id)
                            ? "brightness(1.35) saturate(1.22)"
                            : "brightness(1.2) saturate(1.1)",
                      }}
                    >
                      <span className="lowercase first-letter:uppercase leading-tight">
                        {face.tabLabel}
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {/* 卡片内容区域 */}
            <div className="rounded-3xl rounded-tl-none bg-white/[0.04] p-5 md:p-6 backdrop-blur-2xl shadow-2xl relative overflow-visible border border-white/5 mt-0">
              <div className="pr-4 pb-2">
                {DICE_FACES.map((face) => (
                  <TabsContent key={face.id} value={String(face.id)} className="space-y-4 mt-0">
                    <p className="text-sm md:text-base text-white/70 leading-relaxed">
                      {face.homeDescription ?? face.description}
                    </p>

                    <div className="flex items-center gap-4 ml-[40px] mt-[16px]">
                      <button
                        type="button"
                        onClick={handleOpenCurrentTab}
                        className="group relative rounded-full px-9 py-4 text-sm font-semibold text-white 
                                   transition-all duration-300 hover:scale-105 overflow-hidden"
                        style={{
                          background: `color-mix(in srgb, ${getHomeFaceColor(face.id, face.color)} 13%, transparent)`,
                        }}
                      >
                        <div 
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{ background: `color-mix(in srgb, ${getHomeFaceColor(face.id, face.color)} 21%, transparent)` }}
                        />
                        <span className="relative flex items-center gap-2">
                          <span style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
                            {face.buttonText}
                          </span>
                          <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                        </span>
                      </button>
                    </div>
                  </TabsContent>
                ))}
              </div>

              {/* 3D 骰子区域 - 放在标签卡片右下角 */}
              <div style={{ transform: "translate(76px, 29px)" }}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{
                    opacity: showDimension ? 0 : 1,
                    scale: showDimension ? 0.8 : 1,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute -bottom-8 md:-bottom-7 left-[calc(61%-20px)] -translate-x-1/2 translate-y-[24px] z-0"
                >
                  <Dice3D
                    onFaceSelected={handleFaceSelected}
                    isRolling={isRolling}
                    onRollStart={handleRollStart}
                    onTargetFaceSettled={handleTargetFaceSettled}
                    targetFace={targetFace}
                    activeColor={activeHomeColor}
                  />
                  <div className="absolute left-full ml-4 md:ml-5 top-1/2 -translate-y-1/2 flex items-center gap-2 text-xs md:text-sm text-white/45 whitespace-nowrap">
                    <span>←</span>
                    <span>没兴趣，玩一下骰子</span>
                  </div>
                </motion.div>
              </div>
            </div>
            </Tabs>
          </div>
        </motion.div>

        {/* 底部装饰 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showDimension ? 0 : 1 }}
          transition={{ duration: 0.5 }}
          className="absolute bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-5"
        >
          <span className="w-12 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          <span className="w-12 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </motion.div>

      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed z-50 px-4 py-2 rounded-full text-xs text-white/80 pointer-events-none"
            style={{
              left: `${toastPosition.x}px`,
              top: `${toastPosition.y}px`,
              background: "rgba(30,20,50,0.85)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(168,85,247,0.25)",
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDimension && selectedFace && (
          <DimensionPanel
            faceId={selectedFace}
            onClose={handleCloseDimension}
            onReroll={handleRerollFromPanel}
            onNavigate={handleNavigateFromPanel}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

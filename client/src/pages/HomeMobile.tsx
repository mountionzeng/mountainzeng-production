import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Github, Mail } from "lucide-react";
import Dice3D from "@/components/Dice3D";
import DimensionPanel from "@/components/DimensionPanel";
import ParticleField from "@/components/ParticleField";
import { DICE_FACES } from "@/lib/diceData";

type HomeLanguage = "zh" | "en";
type HomeFaceCopy = {
  tabLabel: string;
  homeDescription: string;
  buttonText: string;
};

const MOBILE_HOME_CONTENT_SHIFT_Y = -73;
const MOBILE_HOME_TAB_FONT_SIZE = 17;
const MOBILE_HOME_TITLE_TUNING = {
  offsetX: 0,
  offsetY: 21,
  scale: 1,
};
const MOBILE_HOME_DICE_TUNING = {
  offsetY: -15,
  scale: 1.61,
};
const MOBILE_HOME_LINKED_OFFSET_Y = 15;

const HOME_FACE_COPY_EN: Record<number, HomeFaceCopy> = {
  1: {
    tabLabel: "Visual",
    homeDescription:
      "Sensitivity and visual intuition are my core strengths. From emotion to image, I translate abstract feelings into cinematic frames.",
    buttonText: "Explore visual works",
  },
  2: {
    tabLabel: "Product management",
    homeDescription:
      "I usually own the full loop from requirement analysis to implementation. For efficiency, I build tools and plugins to automate repetitive work.",
    buttonText: "See product cases",
  },
  3: {
    tabLabel: "Architecture",
    homeDescription:
      "Math gives me a rigorous way of thinking: abstraction, pattern finding, and balancing complexity with efficiency.",
    buttonText: "Read architecture notes",
  },
  4: {
    tabLabel: "Computer system",
    homeDescription:
      "I enjoy creating beautiful visuals, but true efficiency and stability come from understanding system fundamentals and computer internals.",
    buttonText: "Open system map",
  },
  5: {
    tabLabel: "Trans-disciplinarity",
    homeDescription:
      "With both art and CS backgrounds, I can bridge aesthetics and engineering directly, without translation loss between teams.",
    buttonText: "How art meets code",
  },
  6: {
    tabLabel: "Future",
    homeDescription:
      "With capabilities across vision, product, algorithms, systems, and cross-disciplinary practice, I keep building forward with open possibilities.",
    buttonText: "What is next?",
  },
};

function WechatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M8.2 4C4.2 4 1 6.7 1 10c0 1.9 1 3.6 2.6 4.7L3 18l3.1-1.6c.7.2 1.4.3 2.1.3 4 0 7.2-2.7 7.2-6s-3.2-6-7.2-6Zm-3 5.2a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm6 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" />
      <path d="M15.8 9.3c-3 0-5.5 2-5.5 4.5s2.5 4.5 5.5 4.5c.6 0 1.2-.1 1.8-.3l2.4 1.2-.5-2.4c1.2-.8 1.9-1.9 1.9-3.1 0-2.5-2.5-4.4-5.6-4.4Zm-2.3 3.8a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6Zm4.5 0a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6Z" />
    </svg>
  );
}

export default function HomeMobile() {
  const [language, setLanguage] = useState<HomeLanguage>("zh");
  const [isRolling, setIsRolling] = useState(false);
  const [activeTab, setActiveTab] = useState(String(DICE_FACES[0].id));
  const [targetFace, setTargetFace] = useState<number | undefined>(undefined);
  const [selectedFace, setSelectedFace] = useState<number | null>(null);
  const [showDimension, setShowDimension] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const localizedUi = useMemo(
    () =>
      language === "zh"
        ? {
            wechatTitle: "微信",
            githubTitle: "GitHub",
            emailTitle: "邮箱",
            copiedPrefix: "已复制到剪贴板",
            copyFailed: "复制失败，请手动复制",
            diceHint: "点骰子随机进入",
          }
        : {
            wechatTitle: "WeChat",
            githubTitle: "GitHub",
            emailTitle: "Email",
            copiedPrefix: "copied to clipboard",
            copyFailed: "Copy failed. Please copy manually.",
            diceHint: "Tap dice to enter",
          },
    [language]
  );

  const getLocalizedFaceText = useCallback(
    (face: (typeof DICE_FACES)[number]): HomeFaceCopy => {
      if (language === "en" && HOME_FACE_COPY_EN[face.id]) {
        return HOME_FACE_COPY_EN[face.id];
      }
      return {
        tabLabel: face.tabLabel,
        homeDescription: face.homeDescription ?? face.description,
        buttonText: face.buttonText,
      };
    },
    [language]
  );

  const activeFace = useMemo(
    () => DICE_FACES.find((face) => String(face.id) === activeTab) ?? DICE_FACES[0],
    [activeTab]
  );

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(null), 2200);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const copyToClipboard = useCallback(
    async (text: string, label: string, _event?: ReactMouseEvent<HTMLButtonElement>) => {
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
        showToast(`${label} ${localizedUi.copiedPrefix}`);
      } catch {
        showToast(localizedUi.copyFailed);
      }
    },
    [localizedUi, showToast]
  );

  const openFace = useCallback((faceId: number) => {
    setActiveTab(String(faceId));
    setSelectedFace(faceId);
    setShowDimension(true);
    setIsRolling(false);
    setTargetFace(undefined);
  }, []);

  const handleCloseDimension = useCallback(() => {
    setShowDimension(false);
    setSelectedFace(null);
    setIsRolling(false);
    setTargetFace(undefined);
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

  const handleRollStart = useCallback(() => {
    setIsRolling(true);
    setShowDimension(false);
    setSelectedFace(null);
    setTargetFace(undefined);
  }, []);

  const handleFaceSelected = useCallback((faceId: number) => {
    setActiveTab(String(faceId));
    setSelectedFace(faceId);
    setTimeout(() => {
      setShowDimension(true);
      setIsRolling(false);
    }, 420);
  }, []);

  const handleTargetFaceSettled = useCallback(() => {
    setTargetFace(undefined);
    setIsRolling(false);
  }, []);

  const handleTabChange = useCallback(
    (faceId: number) => {
      setActiveTab(String(faceId));
      if (!isRolling && !showDimension) {
        setTargetFace(faceId);
        setIsRolling(true);
      }
    },
    [isRolling, showDimension]
  );

  const activeFaceCopy = getLocalizedFaceText(activeFace);
  const titleOffsetY = MOBILE_HOME_TITLE_TUNING.offsetY + MOBILE_HOME_LINKED_OFFSET_Y;
  const diceOffsetY = MOBILE_HOME_DICE_TUNING.offsetY + MOBILE_HOME_LINKED_OFFSET_Y;

  return (
    <div className="min-h-screen bg-black relative overflow-x-hidden">
      <ParticleField />

      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 48% 24%, rgba(74,123,247,0.24), transparent 40%), radial-gradient(circle at 80% 60%, rgba(168,85,247,0.24), transparent 45%), radial-gradient(circle at 20% 80%, rgba(244,114,182,0.22), transparent 50%)",
        }}
      />

      <main className="relative z-10 min-h-[100dvh] px-4 pt-[max(env(safe-area-inset-top),12px)] pb-[calc(env(safe-area-inset-bottom)+16px)] flex flex-col gap-3">
        <section className="flex items-center justify-between gap-3 shrink-0">
          <div className="inline-flex items-center rounded-full bg-black/65 p-1 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setLanguage("zh")}
              className="h-9 min-w-[68px] px-3 rounded-full text-xs transition-all duration-200"
              style={{
                color: language === "zh" ? "white" : "rgba(255,255,255,0.72)",
                background: language === "zh" ? "rgba(255,255,255,0.18)" : "transparent",
              }}
            >
              中文
            </button>
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className="h-9 min-w-[78px] px-3 rounded-full text-xs transition-all duration-200"
              style={{
                color: language === "en" ? "white" : "rgba(255,255,255,0.72)",
                background: language === "en" ? "rgba(255,255,255,0.18)" : "transparent",
              }}
            >
              English
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              title={localizedUi.wechatTitle}
              aria-label={localizedUi.wechatTitle}
              onClick={(event) =>
                copyToClipboard("JaneZ_0831", language === "zh" ? "微信号 JaneZ_0831" : "WeChat ID JaneZ_0831", event)
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black text-white"
              style={{ color: "rgba(196, 181, 253, 0.95)", boxShadow: "0 0 14px rgba(168, 85, 247, 0.26)" }}
            >
              <WechatIcon className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              title={localizedUi.githubTitle}
              aria-label={localizedUi.githubTitle}
              onClick={(event) => copyToClipboard("https://github.com/mountionzeng", "GitHub https://github.com/mountionzeng", event)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black text-white"
              style={{ color: "rgba(180, 164, 255, 0.95)", boxShadow: "0 0 14px rgba(147, 51, 234, 0.28)" }}
            >
              <Github className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              title={localizedUi.emailTitle}
              aria-label={localizedUi.emailTitle}
              onClick={(event) =>
                copyToClipboard("13261038583@163.com", language === "zh" ? "邮箱 13261038583@163.com" : "Email 13261038583@163.com", event)
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black text-white"
              style={{ color: "rgba(216, 180, 254, 0.95)", boxShadow: "0 0 14px rgba(126, 34, 206, 0.28)" }}
            >
              <Mail className="h-4.5 w-4.5" />
            </button>
          </div>
        </section>

        {/* 中文注释：标题图下方存在透明留白，这里通过负外边距把后续内容整体上提 */}
        <section className="mt-1 shrink-0 -mb-16">
          <img
            src="/Mountion.png"
            alt="Mountion"
            className="mx-auto h-[252px] max-w-[98vw] w-auto object-contain"
            style={{
              transform: `translate(${MOBILE_HOME_TITLE_TUNING.offsetX}px, ${titleOffsetY}px) scale(${MOBILE_HOME_TITLE_TUNING.scale})`,
              transformOrigin: "center center",
            }}
          />
        </section>

        <div
          className="transition-transform duration-150 ease-out"
          style={{ transform: `translateY(${MOBILE_HOME_CONTENT_SHIFT_Y}px)` }}
        >
          <section className="mt-0.5 shrink-0">
            <div className="mx-auto w-full max-w-[420px] h-[210px] flex items-center justify-center overflow-visible">
              <div
                style={{
                  transform: `translateY(${diceOffsetY}px) scale(${MOBILE_HOME_DICE_TUNING.scale})`,
                  transformOrigin: "center center",
                }}
              >
                <Dice3D
                  onFaceSelected={handleFaceSelected}
                  isRolling={isRolling}
                  onRollStart={handleRollStart}
                  onTargetFaceSettled={handleTargetFaceSettled}
                  targetFace={targetFace}
                  activeColor={activeFace.color}
                />
              </div>
            </div>
            <p className="mt-1 text-center text-[11px] text-white/55">{localizedUi.diceHint}</p>
          </section>

          <section className="mt-1 flex-1 flex flex-col min-h-0">
            <div className="grid grid-cols-3 gap-1.5">
              {DICE_FACES.map((face) => {
                const localizedFace = getLocalizedFaceText(face);
                const isActive = String(face.id) === activeTab;
                return (
                  <button
                    key={face.id}
                    type="button"
                    onClick={() => handleTabChange(face.id)}
                    className="min-h-[44px] rounded-xl px-2 py-2 leading-tight transition-all duration-200 flex items-center justify-center"
                    style={{
                      color: face.color,
                      fontSize: `${MOBILE_HOME_TAB_FONT_SIZE}px`,
                      background: isActive
                        ? `linear-gradient(135deg, color-mix(in srgb, ${face.color} 48%, transparent), rgba(16,16,22,0.88))`
                        : "rgba(10,10,15,0.62)",
                      boxShadow: isActive ? `0 0 28px ${face.color}88, inset 0 0 18px ${face.color}44` : "none",
                    }}
                  >
                    <span>{localizedFace.tabLabel}</span>
                  </button>
                );
              })}
            </div>

            <motion.article
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24 }}
              className="mt-2 rounded-2xl border backdrop-blur-xl p-4 flex-1 flex flex-col"
              style={{
                background: `linear-gradient(160deg, color-mix(in srgb, ${activeFace.color} 24%, rgba(10,10,16,0.94)), rgba(5,5,8,0.9))`,
                borderColor: `color-mix(in srgb, ${activeFace.color} 62%, rgba(255,255,255,0.14))`,
                boxShadow: `0 0 32px color-mix(in srgb, ${activeFace.color} 35%, transparent)`,
              }}
            >
              <p className="text-white/82 text-[14px] leading-relaxed">{activeFaceCopy.homeDescription}</p>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => openFace(activeFace.id)}
                  className="h-11 w-full px-3 rounded-full text-sm font-medium text-white"
                  style={{ background: `color-mix(in srgb, ${activeFace.color} 22%, rgba(0,0,0,0.45))` }}
                >
                  {activeFaceCopy.buttonText}
                </button>
              </div>
            </motion.article>
          </section>
        </div>
      </main>

      <AnimatePresence>
        {toast && (
          <motion.div
            key="mobile-toast"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed z-50 left-1/2 -translate-x-1/2 bottom-6 px-4 py-2 rounded-full text-xs text-white/85 pointer-events-none"
            style={{
              background: "rgba(30,20,50,0.85)",
              backdropFilter: "blur(8px)",
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
            language={language}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

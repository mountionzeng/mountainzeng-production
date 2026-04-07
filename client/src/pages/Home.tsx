import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Github, Mail } from "lucide-react";
import Dice3D from "@/components/Dice3D";
import DimensionPanel from "@/components/DimensionPanel";
import ParticleField from "@/components/ParticleField";
import { DICE_FACES } from "@/lib/diceData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type HomeLanguage = "zh" | "en";
type HomeFaceCopy = {
  tabLabel: string;
  homeDescription: string;
  buttonText: string;
};

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
    tabLabel: "Algorithm",
    homeDescription:
      "Math gives me a rigorous way of thinking: abstraction, pattern finding, and balancing complexity with efficiency.",
    buttonText: "Read algorithm notes",
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

const HOME_TITLE_IMAGE_TUNING = {
  offsetX: -204,
  offsetY: -175,
  scale: 1.36,
};

const HOME_DICE_TUNING = {
  offsetX: 134,
  offsetY: 57,
  scale: 1,
};

const HOME_DICE_LEFT_BUTTON_TUNING = {
  offsetX: 202,
  offsetY: 18,
  scale: 1.05,
};

const HOME_DICE_HINT_TUNING = {
  offsetX: 28,
  offsetY: 0,
  scale: 1,
};

const HOME_TITLE_SOCIAL_BUTTONS_TUNING = {
  wechat: { offsetX: 160, offsetY: -30, scale: 1 },
  github: { offsetX: 160, offsetY: -30, scale: 1 },
  mail: { offsetX: 160, offsetY: -30, scale: 1 },
};

// 中文注释：首页按固定设计稿做等比缩放，避免不同显示器比例漂移
const HOME_STAGE_SIZE = {
  width: 1280,
  height: 780,
};

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
  const [language, setLanguage] = useState<HomeLanguage>("zh");
  const [isRolling, setIsRolling] = useState(false);
  const [selectedFace, setSelectedFace] = useState<number | null>(null);
  const [showDimension, setShowDimension] = useState(false);
  const [activeTab, setActiveTab] = useState(String(DICE_FACES[0].id));
  const [targetFace, setTargetFace] = useState<number | undefined>(undefined);
  const [toast, setToast] = useState<string | null>(null);
  const [toastPosition, setToastPosition] = useState({ x: 24, y: 24 });
  const [homeStageScale, setHomeStageScale] = useState(1);
  const titleOffsetX = HOME_TITLE_IMAGE_TUNING.offsetX;
  const titleOffsetY = HOME_TITLE_IMAGE_TUNING.offsetY;
  const titleScale = HOME_TITLE_IMAGE_TUNING.scale;
  const diceOffsetX = HOME_DICE_TUNING.offsetX;
  const diceOffsetY = HOME_DICE_TUNING.offsetY;
  const diceScale = HOME_DICE_TUNING.scale;
  const diceLeftButtonOffsetX = HOME_DICE_LEFT_BUTTON_TUNING.offsetX;
  const diceLeftButtonOffsetY = HOME_DICE_LEFT_BUTTON_TUNING.offsetY;
  const diceLeftButtonScale = HOME_DICE_LEFT_BUTTON_TUNING.scale;
  const diceHintOffsetX = HOME_DICE_HINT_TUNING.offsetX;
  const diceHintOffsetY = HOME_DICE_HINT_TUNING.offsetY;
  const diceHintScale = HOME_DICE_HINT_TUNING.scale;
  const socialWechatOffsetX = HOME_TITLE_SOCIAL_BUTTONS_TUNING.wechat.offsetX;
  const socialWechatOffsetY = HOME_TITLE_SOCIAL_BUTTONS_TUNING.wechat.offsetY;
  const socialWechatScale = HOME_TITLE_SOCIAL_BUTTONS_TUNING.wechat.scale;
  const socialGithubOffsetX = HOME_TITLE_SOCIAL_BUTTONS_TUNING.github.offsetX;
  const socialGithubOffsetY = HOME_TITLE_SOCIAL_BUTTONS_TUNING.github.offsetY;
  const socialGithubScale = HOME_TITLE_SOCIAL_BUTTONS_TUNING.github.scale;
  const socialMailOffsetX = HOME_TITLE_SOCIAL_BUTTONS_TUNING.mail.offsetX;
  const socialMailOffsetY = HOME_TITLE_SOCIAL_BUTTONS_TUNING.mail.offsetY;
  const socialMailScale = HOME_TITLE_SOCIAL_BUTTONS_TUNING.mail.scale;
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
            diceHint: "没兴趣，玩一下骰子",
          }
        : {
            wechatTitle: "WeChat",
            githubTitle: "GitHub",
            emailTitle: "Email",
            copiedPrefix: "copied to clipboard",
            copyFailed: "Copy failed. Please copy manually.",
            diceHint: "Not interested? Roll the dice",
          },
    [language]
  );

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

  useEffect(() => {
    // 中文注释：用 visualViewport 宽高 * zoom 还原真实布局视口，避免域名级缩放差异影响首页比例
    const syncHomeStageScale = () => {
      if (typeof window === "undefined") return;
      const viewport = window.visualViewport;
      const zoom = viewport?.scale ?? 1;
      const viewportWidth = (viewport?.width ?? window.innerWidth) * zoom;
      const viewportHeight = (viewport?.height ?? window.innerHeight) * zoom;
      const widthScale = viewportWidth / HOME_STAGE_SIZE.width;
      const heightScale = viewportHeight / HOME_STAGE_SIZE.height;
      const nextScale = Math.min(widthScale, heightScale);
      setHomeStageScale(nextScale);
    };

    syncHomeStageScale();
    window.addEventListener("resize", syncHomeStageScale);
    window.visualViewport?.addEventListener("resize", syncHomeStageScale);
    window.visualViewport?.addEventListener("scroll", syncHomeStageScale);

    return () => {
      window.removeEventListener("resize", syncHomeStageScale);
      window.visualViewport?.removeEventListener("resize", syncHomeStageScale);
      window.visualViewport?.removeEventListener("scroll", syncHomeStageScale);
    };
  }, []);

  const copyToClipboard = useCallback(
    async (text: string, label: string, event?: ReactMouseEvent<HTMLButtonElement>) => {
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
        showToast(`${label} ${localizedUi.copiedPrefix}`);
      } catch {
        showToast(localizedUi.copyFailed);
      }
    },
    [localizedUi, placeToastNearPointer, showToast]
  );

  // 中文注释：首页语言文本映射（默认中文，切换后只影响首页展示）
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

      {/* 中文注释：首页语言切换按钮，默认中文 */}
      <div className="fixed top-5 right-5 z-40">
        <div className="inline-flex items-center rounded-full border border-white/20 bg-black/70 p-1 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setLanguage("zh")}
            className="px-3 py-1.5 text-xs rounded-full transition-all duration-200"
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
            className="px-3 py-1.5 text-xs rounded-full transition-all duration-200"
            style={{
              color: language === "en" ? "white" : "rgba(255,255,255,0.72)",
              background: language === "en" ? "rgba(255,255,255,0.18)" : "transparent",
            }}
          >
            English
          </button>
        </div>
      </div>

      {/* 用轻量叠层提亮，避免整屏 filter 触发昂贵重采样 */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, rgba(255,255,255,0.11) 0%, rgba(96,165,250,0.10) 24%, rgba(244,114,182,0.08) 44%, transparent 70%)",
        }}
      />

      {/* 背景装饰渐变 */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
      >
        <div 
          className="absolute -top-28 left-1/4 w-[30rem] h-[30rem] rounded-full opacity-20 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(74,123,247,0.95) 0%, rgba(78,205,196,0.62) 42%, transparent 76%)",
          }}
        />
        <div 
          className="absolute top-[28%] right-[18%] w-[25rem] h-[25rem] rounded-full opacity-16 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(168,85,247,0.84) 0%, rgba(96,165,250,0.48) 48%, transparent 78%)",
          }}
        />
        <div 
          className="absolute bottom-0 right-1/4 w-[28rem] h-[28rem] rounded-full opacity-18 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(244,114,182,0.94) 0%, rgba(255,217,61,0.56) 46%, transparent 78%)",
          }}
        />
      </div>

      {/* 软化顶部背景过渡，避免合成层边界出现横向接缝 */}
      <div
        className="fixed inset-x-0 top-0 h-44 z-[1] pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(2,6,23,0.72) 0%, rgba(2,6,23,0.38) 52%, rgba(2,6,23,0) 100%)",
        }}
      />

      <div className="relative z-10 h-full flex items-center justify-center overflow-hidden">
        <div
          className="relative"
          style={{
            width: `${HOME_STAGE_SIZE.width}px`,
            height: `${HOME_STAGE_SIZE.height}px`,
            transform: `scale(${homeStageScale})`,
            transformOrigin: "center center",
          }}
        >
          <div
            className="relative h-full flex flex-col items-center justify-center px-4 py-4"
            style={{ transform: "translate(0px, 44px)" }}
          >
        
        {/* 主标题区域 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={showDimension ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="absolute top-2/3 left-0 right-0 z-20 h-[360px] w-full text-center pointer-events-none -translate-y-1/2"
        >
          <div
            className="absolute left-1/2 top-2/3 w-fit"
            style={{
              transform: `translate(-50%, -50%) translate(${titleOffsetX}px, ${titleOffsetY}px)`,
            }}
          >
            <motion.div
              className="pointer-events-none absolute -inset-[10%] rounded-full blur-[44px] mix-blend-screen transform-gpu"
              style={{
                background:
                  "conic-gradient(from 0deg, rgba(78,205,196,0.38), rgba(74,123,247,0.45), rgba(168,85,247,0.36), rgba(244,114,182,0.40), rgba(255,217,61,0.34), rgba(78,205,196,0.38))",
                willChange: "transform, opacity",
              }}
              animate={{
                rotate: [0, 360],
                scale: [1, 1.1, 1],
                opacity: [0.42, 0.62, 0.42],
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
                  "radial-gradient(circle at 30% 30%, rgba(74,123,247,0.38), transparent 48%), radial-gradient(circle at 75% 35%, rgba(78,205,196,0.32), transparent 50%), radial-gradient(circle at 50% 75%, rgba(244,114,182,0.38), transparent 52%)",
                willChange: "transform, opacity",
              }}
              animate={{
                rotate: [360, 0],
                scale: [1.02, 1.14, 1.02],
                opacity: [0.34, 0.5, 0.34],
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
                  "radial-gradient(circle at 20% 50%, rgba(78,205,196,0.32), transparent 46%), radial-gradient(circle at 80% 45%, rgba(168,85,247,0.34), transparent 48%), radial-gradient(circle at 50% 80%, rgba(255,217,61,0.28), transparent 52%)",
                willChange: "transform, opacity",
              }}
              animate={{
                rotate: [0, 180, 360],
                scale: [1, 1.08, 1],
                opacity: [0.24, 0.4, 0.24],
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
              className="relative block h-auto w-[882px]"
              style={{
                transform: `scale(${titleScale})`,
                transformOrigin: "center",
              }}
            />
            <div className="absolute left-full ml-3 md:ml-4 top-1/2 -translate-y-1/2 pointer-events-auto z-30">
              <div
                className="flex items-center gap-2"
                style={{ transform: "translate(162px, -68px)" }}
              >
                <button
                  type="button"
                  title={localizedUi.wechatTitle}
                  aria-label={localizedUi.wechatTitle}
                  onClick={(event) =>
                    copyToClipboard("JaneZ_0831", language === "zh" ? "微信号 JaneZ_0831" : "WeChat ID JaneZ_0831", event)
                  }
                  className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full bg-black text-white
                             transition-all duration-200 hover:scale-105"
                  style={{
                    color: "rgba(196, 181, 253, 0.95)",
                    boxShadow: "0 0 14px rgba(168, 85, 247, 0.26)",
                    transform: `translate(${socialWechatOffsetX}px, ${socialWechatOffsetY}px) scale(${socialWechatScale})`,
                    transformOrigin: "center",
                  }}
                >
                  <WechatIcon className="h-[18px] w-[18px]" />
                </button>
                <button
                  type="button"
                  title={localizedUi.githubTitle}
                  aria-label={localizedUi.githubTitle}
                  onClick={(event) => copyToClipboard("https://github.com/mountionzeng", "GitHub https://github.com/mountionzeng", event)}
                  className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full bg-black text-white
                             transition-all duration-200 hover:scale-105"
                  style={{
                    color: "rgba(180, 164, 255, 0.95)",
                    boxShadow: "0 0 14px rgba(147, 51, 234, 0.28)",
                    transform: `translate(${socialGithubOffsetX}px, ${socialGithubOffsetY}px) scale(${socialGithubScale})`,
                    transformOrigin: "center",
                  }}
                >
                  <Github className="h-[18px] w-[18px]" />
                </button>
                <button
                  type="button"
                  title={localizedUi.emailTitle}
                  aria-label={localizedUi.emailTitle}
                  onClick={(event) =>
                    copyToClipboard("13261038583@163.com", language === "zh" ? "邮箱 13261038583@163.com" : "Email 13261038583@163.com", event)
                  }
                  className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full bg-black text-white
                             transition-all duration-200 hover:scale-105"
                  style={{
                    color: "rgba(216, 180, 254, 0.95)",
                    boxShadow: "0 0 14px rgba(126, 34, 206, 0.28)",
                    transform: `translate(${socialMailOffsetX}px, ${socialMailOffsetY}px) scale(${socialMailScale})`,
                    transformOrigin: "center",
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
          // 中文注释：按需求将首页面板整体沿 Y 轴上移 20px（移动端/桌面端分别下调）
          className="w-full max-w-7xl mt-1 md:mt-2 translate-y-[78px] md:translate-y-[84px] relative origin-top"
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
                  const localizedFace = getLocalizedFaceText(face);
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
                      <span className="leading-tight">
                        {localizedFace.tabLabel}
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {/* 卡片内容区域 */}
            <div className="rounded-3xl rounded-tl-none bg-white/[0.04] p-5 md:p-6 backdrop-blur-2xl shadow-2xl relative overflow-visible border border-white/5 mt-0">
              <div className="pr-4 pb-2">
                {DICE_FACES.map((face) => {
                  const localizedFace = getLocalizedFaceText(face);
                  return (
                    <TabsContent key={face.id} value={String(face.id)} className="space-y-4 mt-0">
                      <p className="text-sm md:text-base text-white/70 leading-relaxed">
                        {localizedFace.homeDescription}
                      </p>

                      <div
                        className="flex items-center gap-4 ml-[24px] mt-[16px]"
                        style={{
                          transform: `translate(${diceLeftButtonOffsetX}px, ${diceLeftButtonOffsetY}px) scale(${diceLeftButtonScale})`,
                          transformOrigin: "left center",
                        }}
                      >
                        <button
                          type="button"
                          onClick={handleOpenCurrentTab}
                          className="group relative rounded-full px-8 py-[14px] text-[0.8rem] font-semibold text-white 
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
                              {localizedFace.buttonText}
                            </span>
                            <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                          </span>
                        </button>
                      </div>
                    </TabsContent>
                  );
                })}
              </div>

              {/* 3D 骰子区域 - 放在标签卡片右下角 */}
              <div style={{ transform: `translate(${diceOffsetX}px, ${diceOffsetY}px) scale(${diceScale})` }}>
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
                    <div
                      className="flex items-center gap-2"
                      style={{
                        transform: `translate(${diceHintOffsetX}px, ${diceHintOffsetY}px) scale(${diceHintScale})`,
                        transformOrigin: "left center",
                      }}
                    >
                      <span>←</span>
                      <span>{localizedUi.diceHint}</span>
                    </div>
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
        </div>
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
            language={language}
          />
        )}
      </AnimatePresence>

    </div>
  );
}

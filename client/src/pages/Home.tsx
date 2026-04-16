import { lazy, Suspense, useEffect, useState } from "react";

const HomeDesktop = lazy(() => import("./HomeDesktop"));
const HomeMobile = lazy(() => import("./HomeMobile"));

const MOBILE_HOME_BREAKPOINT = 900;

export default function HomeEntry() {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia(`(max-width: ${MOBILE_HOME_BREAKPOINT}px)`).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // 中文注释：双首页架构入口，根据屏幕宽度切换移动首页/桌面首页。
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_HOME_BREAKPOINT}px)`);
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    setIsMobile(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return (
    <Suspense
      fallback={<div className="h-screen bg-black text-white/70 flex items-center justify-center">Loading...</div>}
    >
      {isMobile ? <HomeMobile /> : <HomeDesktop />}
    </Suspense>
  );
}

import { useEffect } from "react";
import { Link } from "wouter";

// 中文注释：奇绩创坛申请视频页，视频与封面托管在 OSS（videos/ 前缀），页面只引用 URL
const QIJI_VIDEO_URL = "https://mountion.oss-cn-beijing.aliyuncs.com/videos/qiji-application.mp4";
const QIJI_POSTER_URL = "https://mountion.oss-cn-beijing.aliyuncs.com/videos/qiji-application-poster.jpg";

export default function QijiApplication() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "奇绩创坛申请视频 · 曾翔羽";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-neutral-950 text-neutral-100 px-4 py-10">
      <header className="mb-6 text-center">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-wide">
          奇绩创坛 · 申请视频
        </h1>
        <p className="mt-2 text-sm text-neutral-400">曾翔羽 · 小酌 Drinking Time</p>
      </header>

      <video
        className="w-auto max-w-full max-h-[78vh] aspect-[1080/1918] rounded-2xl bg-black shadow-2xl ring-1 ring-white/10"
        src={QIJI_VIDEO_URL}
        poster={QIJI_POSTER_URL}
        controls
        playsInline
        preload="metadata"
      />

      <footer className="mt-8">
        <Link
          href="/"
          className="text-sm text-neutral-500 transition-colors hover:text-neutral-200"
        >
          ← 返回主页 mountion.cn
        </Link>
      </footer>
    </div>
  );
}

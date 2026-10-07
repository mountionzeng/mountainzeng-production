import { useEffect } from "react";
import { Link } from "wouter";

// 中文注释：作品视频放在 public/videos，构建后会以根路径 /videos/... 访问。
const SHESELF_VIDEO_URL = "/videos/sheself-rough-cut-20260713.mp4";
const SHESELF_POSTER_URL = "";

export default function SheselfVideo() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "sheself · Yuandai";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <main className="min-h-screen w-full bg-neutral-950 text-neutral-100">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-8 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
          <Link
            href="/"
            className="text-xs uppercase tracking-[0.28em] text-white/45 transition-colors hover:text-white"
          >
            Mountion
          </Link>
          <span className="text-xs uppercase tracking-[0.28em] text-white/35">
            Moving Image
          </span>
        </header>

        <section className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(340px,0.58fr)] lg:py-14">
          <div className="order-2 lg:order-1">
            <div className="relative overflow-hidden rounded-sm bg-black shadow-2xl ring-1 ring-white/10">
              {SHESELF_VIDEO_URL ? (
                <video
                  className="aspect-video w-full bg-black object-contain"
                  src={SHESELF_VIDEO_URL}
                  poster={SHESELF_POSTER_URL || undefined}
                  controls
                  playsInline
                  preload="metadata"
                />
              ) : (
                <div className="flex aspect-video w-full flex-col items-center justify-center gap-4 bg-neutral-900 px-6 text-center">
                  <p className="font-display text-3xl text-white/80 sm:text-5xl">
                    sheself
                  </p>
                  <p className="max-w-md text-sm leading-7 text-white/45">
                    The rough cut will be placed here. Selected stills and refined
                    edit will continue to be updated on this page.
                  </p>
                </div>
              )}
            </div>
          </div>

          <article className="order-1 space-y-8 lg:order-2">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.32em] text-white/40">
                AI-assisted moving image
              </p>
              <h1 className="font-display text-6xl leading-none text-white sm:text-7xl lg:text-8xl">
                sheself
              </h1>
              <p className="max-w-xl text-base leading-8 text-white/68">
                一件关于女性内在奥德赛的 AI 辅助动态影像作品：在失去外部参照、无法依靠现成规则定义自己时，如何从自己的感受、判断和生命力里，重新生成面对未来的勇气。
              </p>
            </div>

            <div className="space-y-5 border-l border-white/12 pl-5">
              <p className="text-sm leading-7 text-white/58">
                This page holds the current rough cut and will be updated with the
                refined edit after submission.
              </p>
              <p className="text-sm leading-7 text-white/58">
                《sheself》也是 Drinking Time / 小酌方向中的一个个人实验：把尚未说清的情绪、记忆和生命经验，转化成可以被看见的影像叙事。
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="/drinking-time-vision/#vision"
                className="rounded-sm border border-white/20 px-4 py-2 text-sm text-white/72 transition-colors hover:border-white/45 hover:text-white"
                target="_blank"
                rel="noopener noreferrer"
              >
                Drinking Time / 小酌
              </a>
              <Link
                href="/"
                className="rounded-sm border border-white/10 px-4 py-2 text-sm text-white/50 transition-colors hover:border-white/35 hover:text-white"
              >
                返回个人网站
              </Link>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}

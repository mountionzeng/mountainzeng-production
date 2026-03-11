/*
 * Dimension Panel — 全屏维度展示
 * 更现代的设计，更好的动画过渡
 */

import { useEffect, useRef, useState } from "react";
import type { SVGProps } from "react";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { DICE_FACES } from "@/lib/diceData";
import type { DiceFace, WorkItem } from "@/lib/diceData";
import { ArrowLeft, Dices, Sparkles, ExternalLink, ChevronRight, ChevronDown } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import type { CarouselApi } from "@/components/ui/carousel";
import {
  buildVisualImageUrl,
  buildVisualPosterUrl,
  buildVisualVideoUrl,
  DEFAULT_VISUAL_CDN_BASE_URL,
  VISUAL_IMAGE_ITEMS,
  VISUAL_VIDEO_ITEMS,
} from "@/lib/visualPortfolio";

// 图标渲染辅助函数
const renderIcon = (iconName: string, props: SVGProps<SVGSVGElement>) => {
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent ? <IconComponent {...props} /> : <span>{iconName}</span>;
};

interface DimensionPanelProps {
  faceId: number;
  onClose: () => void;
  onReroll: (nextFaceId: number) => void;
  onNavigate: (nextFaceId: number) => void;
}

const REROLL_ANIM_DURATION_MS = 900;
const VISUAL_VIDEO_PAGE_SIZE = 9;
const VISUAL_IMAGE_PAGE_SIZE = 12;
// 视觉页前两张图为单独大图行
const VISUAL_IMAGE_SOLO_ROW_COUNT = 2;
// 按当前页面排版隐藏第 5、6 行（用户定制）
const VISUAL_IMAGE_EXCLUDED_DISPLAY_ROWS = new Set([5, 6]);
const VISUAL_IMAGE_GRID_COLUMN_COUNT = 3;
// 将网格区的第 2 行单独抽出来作为独立层展示
const VISUAL_IMAGE_ISOLATED_GRID_ROW_INDEX = 1;

function getVisualImageDisplayRow(displayIndex: number): number {
  if (displayIndex <= VISUAL_IMAGE_SOLO_ROW_COUNT) {
    return displayIndex;
  }
  return VISUAL_IMAGE_SOLO_ROW_COUNT + 1 + Math.floor((displayIndex - VISUAL_IMAGE_SOLO_ROW_COUNT - 1) / VISUAL_IMAGE_GRID_COLUMN_COUNT);
}

/* ─── 动画变体 ─── */
const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

/* ─── 通用作品卡片组件 ─── */
function WorkCard({ work, color, index }: { work: WorkItem; color: string; index: number }) {
  return (
    <motion.div
      custom={index}
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      className="group rounded-2xl p-6 md:p-7 relative overflow-hidden transition-all duration-300 hover:scale-[1.02]"
      style={{
        background: `linear-gradient(145deg, ${color}0D, ${color}05)`,
        border: `1px solid ${color}20`,
      }}
    >
      {/* hover 光效 */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(circle at 30% 30%, ${color}15, transparent 70%)` }}
      />

      <div className="relative z-10">
        {/* 标签 */}
        {work.tags && work.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {work.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] tracking-[0.15em] uppercase px-2.5 py-1 rounded-full font-medium"
                style={{ color: `${color}CC`, background: `${color}15`, border: `1px solid ${color}25` }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 标题 */}
        <h3
          className="text-lg md:text-xl font-bold text-white mb-2 leading-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {work.title}
        </h3>

        {/* 角色 */}
        {work.role && (
          <div className="text-xs tracking-[0.1em] mb-3 font-medium" style={{ color: `${color}AA` }}>
            {work.role}
          </div>
        )}

        {/* 描述 */}
        {work.description && (
          <p className="text-sm text-white/55 leading-relaxed mb-4" style={{ fontFamily: "var(--font-body)" }}>
            {work.description}
          </p>
        )}

        {/* 亮点 */}
        {work.highlights && work.highlights.length > 0 && (
          <ul className="space-y-2">
            {work.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-white/50">
                <ChevronRight size={14} className="mt-0.5 flex-shrink-0" style={{ color: `${color}80` }} />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 底部进度条 */}
      <div
        className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-700"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}40)` }}
      />
    </motion.div>
  );
}

/* ─── 统计数据组件 ─── */
function StatsGrid({ stats, color }: { stats: { label: string; value: string }[]; color: string }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          custom={i}
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="rounded-xl p-4 text-center"
          style={{
            background: `linear-gradient(145deg, ${color}0A, ${color}05)`,
            border: `1px solid ${color}18`,
          }}
        >
          <div className="text-xl md:text-2xl font-bold mb-1" style={{ color: `${color}DD`, fontFamily: "var(--font-display)" }}>
            {stat.value}
          </div>
          <div className="text-[11px] tracking-[0.12em] text-white/40 uppercase" style={{ fontFamily: "var(--font-label)" }}>
            {stat.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── 时间线组件 ─── */
function Timeline({ timeline, color }: { timeline: DiceFace["timeline"]; color: string }) {
  if (!timeline || timeline.length === 0) return null;
  return (
    <div className="space-y-0">
      {timeline.map((item, i) => (
        <motion.div
          key={item.period}
          custom={i}
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative pl-8 pb-8 last:pb-0"
        >
          {/* 时间线竖线 */}
          {i < timeline.length - 1 && (
            <div
              className="absolute left-[7px] top-3 bottom-0 w-[1px]"
              style={{ background: `linear-gradient(180deg, ${color}40, ${color}10)` }}
            />
          )}
          {/* 时间线圆点 */}
          <div
            className="absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full border-2"
            style={{ borderColor: color, background: `${color}20` }}
          />

          <div className="text-xs tracking-[0.15em] text-white/35 mb-1" style={{ fontFamily: "var(--font-label)" }}>
            {item.period}
          </div>
          <div className="text-base font-semibold text-white/90 mb-0.5" style={{ fontFamily: "var(--font-display)" }}>
            {item.company}
          </div>
          <div className="text-xs mb-2" style={{ color: `${color}AA` }}>
            {item.role}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {item.projects.map((p) => (
              <span
                key={p}
                className="text-[11px] px-2 py-0.5 rounded-md text-white/50"
                style={{ background: `${color}10`, border: `1px solid ${color}15` }}
              >
                {p}
              </span>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── 课程列表组件 ─── */
function CourseList({ courses, color }: { courses: DiceFace["courses"]; color: string }) {
  if (!courses || courses.length === 0) return null;
  const categories = Array.from(new Set(courses.map((c) => c.category)));
  return (
    <div className="space-y-6">
      {categories.map((cat) => (
        <div key={cat}>
          <div className="text-xs tracking-[0.2em] uppercase font-semibold mb-3" style={{ color: `${color}AA`, fontFamily: "var(--font-label)" }}>
            {cat}
          </div>
          <div className="space-y-2">
            {courses
              .filter((c) => c.category === cat)
              .map((c) => (
                <div
                  key={c.code}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors duration-200 hover:bg-white/[0.03]"
                  style={{ border: `1px solid ${color}12` }}
                >
                  <span className="text-xs font-mono font-semibold tracking-wider" style={{ color: `${color}CC` }}>
                    {c.code}
                  </span>
                  <span className="text-sm text-white/60">{c.name}</span>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── 编程语言能力组件（系统页专用）─── */
function ProgrammingLanguageCapability({ color }: { color: string }) {
  return (
    <div
      className="rounded-2xl p-6 md:p-8 space-y-6"
      style={{
        background: `linear-gradient(145deg, ${color}12, ${color}06)`,
        border: `1px solid ${color}28`,
      }}
    >
      <div
        className="text-sm tracking-[0.16em] uppercase font-semibold"
        style={{ color: `${color}CC`, fontFamily: "var(--font-label)" }}
      >
        编程语言能力
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className="rounded-xl p-4"
          style={{ border: `1px solid ${color}20`, background: `${color}0A` }}
        >
          <div className="text-sm font-semibold text-white/88 mb-3">【底层系统】</div>
          <div className="text-sm text-white/75">C / C++</div>
          <div className="text-sm text-white/45 my-1.5">↓ 实现</div>
          <div className="text-sm text-white/65 leading-relaxed">操作系统、数据库内核、编程语言解释器</div>
          <div className="text-sm text-white/45 mt-2">↓ 提供基础设施</div>
        </div>

        <div
          className="rounded-xl p-4"
          style={{ border: `1px solid ${color}20`, background: `${color}0A` }}
        >
          <div className="text-sm font-semibold text-white/88 mb-3">【应用层】</div>
          <div className="text-sm text-white/75">Java / Python</div>
          <div className="text-sm text-white/45 my-1.5">↓ 开发</div>
          <div className="text-sm text-white/65 leading-relaxed">Web 服务、数据分析、机器学习应用</div>
        </div>
      </div>

      <div className="space-y-3 text-sm leading-relaxed">
        <p className="text-white/72">
          <span style={{ color: `${color}D8` }}>核心语言：</span>
          Java、C、C++、Python
        </p>
        <p className="text-white/62">
          <span style={{ color: `${color}D8` }}>补足方式：</span>
          其他不熟悉的编程语言，通过 Voice Coding 快速补足
        </p>
      </div>
    </div>
  );
}

/* ─── 技术应用组件 ─── */
function TechApplications({ apps, color }: { apps: DiceFace["techApplications"]; color: string }) {
  if (!apps || apps.length === 0) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {apps.map((app, i) => (
        <motion.div
          key={app.title}
          custom={i}
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="rounded-xl p-5 relative overflow-hidden"
          style={{
            background: `linear-gradient(145deg, ${color}0D, ${color}05)`,
            border: `1px solid ${color}20`,
          }}
        >
          <div className="text-sm font-semibold text-white/80 mb-3" style={{ fontFamily: "var(--font-display)" }}>
            {app.title}
          </div>
          <div className="space-y-1.5">
            {app.items.map((item) => (
              <div key={item} className="flex items-center gap-2 text-xs text-white/45">
                <div className="w-1 h-1 rounded-full" style={{ background: `${color}80` }} />
                {item}
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── 联系方式组件 ─── */
function ContactSection({ contactInfo, color }: { contactInfo: DiceFace["contactInfo"]; color: string }) {
  if (!contactInfo || contactInfo.length === 0) return null;
  return (
    <div className="space-y-3">
      {contactInfo.map((c) => (
        <div
          key={c.type}
          className="flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-200 hover:scale-[1.01] cursor-pointer"
          style={{
            background: `linear-gradient(145deg, ${color}0A, ${color}04)`,
            border: `1px solid ${color}18`,
          }}
        >
          {renderIcon(c.icon, { size: 18, style: { color: `${color}BB` } } as any)}
          <div>
            <div className="text-xs text-white/35 mb-0.5" style={{ fontFamily: "var(--font-label)" }}>
              {c.type}
            </div>
            <div className="text-sm text-white/70">{c.value}</div>
          </div>
          <ExternalLink size={14} className="ml-auto text-white/20" />
        </div>
      ))}
    </div>
  );
}

/* ─── 知识体系链条组件（算法页专用）─── */
function KnowledgeChain({ chain, color }: { chain: NonNullable<DiceFace["knowledgeChain"]>; color: string }) {
  return (
    <div className="space-y-0">
      {chain.map((level, i) => (
        <motion.div
          key={level.level}
          custom={i}
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative"
        >
          <div
            className="rounded-xl p-5 relative overflow-hidden"
            style={{
              background: `linear-gradient(145deg, ${color}${String(8 + i * 3).padStart(2, "0")}, ${color}04)`,
              border: `1px solid ${color}${String(15 + i * 5).padStart(2, "0")}`,
            }}
          >
            <div
              className="text-xs tracking-[0.25em] uppercase font-semibold mb-3"
              style={{ color: `${color}CC`, fontFamily: "var(--font-label)" }}
            >
              {level.level}
            </div>
            <div className="flex flex-wrap gap-2">
              {level.items.map((item) => (
                <span
                  key={item}
                  className="px-3 py-1.5 text-xs rounded-full text-white/65"
                  style={{
                    background: `${color}12`,
                    border: `1px solid ${color}20`,
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          {/* 连接箭头 */}
          {i < chain.length - 1 && (
            <div className="flex justify-center py-2">
              <ChevronDown size={20} style={{ color: `${color}50` }} />
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

/* ─── 数学作业浏览组件（算法页专用）─── */
function MathAssignmentsPanel({
  assignments,
  color,
}: {
  assignments: NonNullable<DiceFace["mathAssignments"]>;
  color: string;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setActiveIndex(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  return (
    <div
      className="rounded-2xl p-4 md:p-6"
      style={{
        background: `linear-gradient(145deg, ${color}10, ${color}05)`,
        border: `1px solid ${color}22`,
      }}
    >
      <Carousel setApi={setApi} opts={{ align: "start", loop: false }} className="w-full">
        <CarouselContent className="-ml-0">
          {assignments.map((assignment) => (
            <CarouselItem key={assignment.subject} className="pl-0 basis-full">
              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_240px] gap-4 md:gap-5">
                <a
                  href={assignment.previewImage}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl overflow-hidden"
                  style={{ border: `1px solid ${color}28`, background: `${color}08` }}
                >
                  <img
                    src={assignment.previewImage}
                    alt={`${assignment.subject}作业预览`}
                    className="w-full h-[300px] md:h-[440px] object-cover"
                    loading="lazy"
                  />
                </a>
                <div className="flex flex-col justify-between gap-4">
                  <div>
                    <div
                      className="text-xs tracking-[0.16em] uppercase mb-2"
                      style={{ color: `${color}B8`, fontFamily: "var(--font-label)" }}
                    >
                      数学基础模块
                    </div>
                    <h4 className="text-lg md:text-xl font-semibold text-white/92 mb-2" style={{ fontFamily: "var(--font-display)" }}>
                      {assignment.subject}
                    </h4>
                    {assignment.note && <p className="text-sm text-white/62 leading-relaxed">{assignment.note}</p>}
                  </div>

                  <div className="flex flex-col gap-2">
                    <a
                      href={assignment.pdfFile}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-between rounded-lg px-4 py-2.5 text-sm text-white/85 transition-colors hover:text-white"
                      style={{ border: `1px solid ${color}36`, background: `${color}12` }}
                    >
                      查看 PDF 原件
                      <ExternalLink size={14} />
                    </a>
                    <a
                      href={assignment.previewImage}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-between rounded-lg px-4 py-2.5 text-sm text-white/70 transition-colors hover:text-white/90"
                      style={{ border: `1px solid ${color}24`, background: `${color}08` }}
                    >
                      查看高清预览
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {assignments.map((assignment, index) => (
            <button
              key={assignment.subject}
              type="button"
              onClick={() => api?.scrollTo(index)}
              className="h-2.5 rounded-full transition-all duration-200"
              style={{
                width: activeIndex === index ? "26px" : "10px",
                background: activeIndex === index ? color : `${color}40`,
              }}
              aria-label={`切换到${assignment.subject}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => api?.scrollPrev()}
            className="rounded-lg px-3 py-1.5 text-xs text-white/75 transition-colors hover:text-white"
            style={{ border: `1px solid ${color}30`, background: `${color}12` }}
          >
            上一个
          </button>
          <button
            type="button"
            onClick={() => api?.scrollNext()}
            className="rounded-lg px-3 py-1.5 text-xs text-white/75 transition-colors hover:text-white"
            style={{ border: `1px solid ${color}30`, background: `${color}12` }}
          >
            下一个
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── 教育轨迹组件（跨界页专用）─── */
function EducationTimeline({ timeline, color }: { timeline: NonNullable<DiceFace["educationTimeline"]>; color: string }) {
  return (
    <div className="space-y-0">
      {timeline.map((item, i) => (
        <motion.div
          key={item.period}
          custom={i}
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative pl-8 pb-10 last:pb-0"
        >
          {/* 竖线 */}
          {i < timeline.length - 1 && (
            <div
              className="absolute left-[7px] top-3 bottom-0 w-[1px]"
              style={{ background: `linear-gradient(180deg, ${color}40, ${color}10)` }}
            />
          )}
          {/* 圆点 */}
          <div
            className="absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full border-2"
            style={{ borderColor: color, background: `${color}20` }}
          />

          <div className="text-xs tracking-[0.15em] text-white/35 mb-2" style={{ fontFamily: "var(--font-label)" }}>
            {item.period}
          </div>
          <div className="text-lg font-semibold text-white/90 mb-1" style={{ fontFamily: "var(--font-display)" }}>
            {item.school}
          </div>
          <div className="text-sm mb-2" style={{ color: `${color}BB` }}>
            {item.degree}
          </div>
          <div className="space-y-1.5 mt-3">
            <div className="flex items-start gap-2 text-xs text-white/50">
              <span className="text-white/30 flex-shrink-0">方向：</span>
              <span>{item.direction}</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-white/50">
              <span className="text-white/30 flex-shrink-0">培养：</span>
              <span>{item.cultivation}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── 系统能力卡片组件（系统页专用）─── */
function SystemCapabilityCards({ capabilities, color }: { capabilities: NonNullable<DiceFace["systemCapabilities"]>; color: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {capabilities.map((cap, i) => (
        <motion.div
          key={cap.title}
          custom={i}
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="group rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:scale-[1.02]"
          style={{
            background: `linear-gradient(145deg, ${color}0D, ${color}05)`,
            border: `1px solid ${color}20`,
          }}
        >
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: `radial-gradient(circle at 30% 30%, ${color}15, transparent 70%)` }}
          />
          <div className="relative z-10">
            <div
              className="text-base font-semibold text-white/85 mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {cap.title}
            </div>
            <div className="space-y-2">
              {cap.items.map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-white/50">
                  <ChevronRight size={14} className="mt-0.5 flex-shrink-0" style={{ color: `${color}80` }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div
            className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-700"
            style={{ background: `linear-gradient(90deg, ${color}, ${color}40)` }}
          />
        </motion.div>
      ))}
    </div>
  );
}

/* ─── 未来方向组件（未来页专用）─── */
function FutureDirections({ directions, color }: { directions: NonNullable<DiceFace["futureDirections"]>; color: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {directions.map((dir, i) => (
        <motion.div
          key={dir.title}
          custom={i}
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="group rounded-2xl p-6 md:p-8 relative overflow-hidden transition-all duration-300 hover:scale-[1.01]"
          style={{
            background: `linear-gradient(145deg, ${color}0D, ${color}05)`,
            border: `1px solid ${color}20`,
          }}
        >
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: `radial-gradient(circle at 30% 30%, ${color}12, transparent 70%)` }}
          />
          <div className="relative z-10">
            <div
              className="text-lg font-semibold text-white/90 mb-5"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {dir.title}
            </div>
            <div className="space-y-3">
              {dir.items.map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm text-white/55">
                  <ChevronRight size={14} className="mt-0.5 flex-shrink-0" style={{ color: `${color}80` }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div
            className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-700"
            style={{ background: `linear-gradient(90deg, ${color}, ${color}40)` }}
          />
        </motion.div>
      ))}
    </div>
  );
}

/* ─── 跨界优势组件 ─── */
function HybridAdvantages({ advantages, color }: { advantages: NonNullable<DiceFace["hybridAdvantages"]>; color: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {advantages.map((adv, i) => (
        <motion.div
          key={adv.title}
          custom={i}
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="rounded-2xl p-6 md:p-8 text-center relative overflow-hidden"
          style={{
            background: `linear-gradient(145deg, ${color}10, ${color}05)`,
            border: `1px solid ${color}25`,
          }}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{ background: `radial-gradient(circle at 50% 50%, ${color}30, transparent 60%)` }}
          />
          <div className="relative z-10">
            <div
              className="text-2xl md:text-3xl font-bold mb-3"
              style={{ color: `${color}DD`, fontFamily: "var(--font-display)" }}
            >
              {adv.title}
            </div>
            <div className="text-sm text-white/55 leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
              {adv.description}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── 下一个维度导航 ─── */
function NextDimensionNav({ currentId, color, onNavigate }: { currentId: number; color: string; onNavigate: (id: number) => void }) {
  const nextId = currentId < DICE_FACES.length ? currentId + 1 : 1;
  const nextFace = DICE_FACES[nextId - 1];
  if (!nextFace) return null;
  return (
    <motion.button
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      onClick={() => onNavigate(nextId)}
      className="group flex items-center gap-3 px-5 py-3 rounded-xl transition-all duration-300 hover:scale-[1.03]"
      style={{
        background: `linear-gradient(135deg, ${nextFace.color}12, ${nextFace.color}06)`,
        border: `1px solid ${nextFace.color}25`,
      }}
    >
      <span className="text-xs tracking-[0.15em] uppercase text-white/40" style={{ fontFamily: "var(--font-label)" }}>
        下一个
      </span>
      <span className="text-sm font-semibold" style={{ color: `${nextFace.color}CC` }}>
        {nextFace.title}
      </span>
      <ChevronRight size={16} className="text-white/30 group-hover:translate-x-1 transition-transform" />
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Section 标题辅助组件
   ═══════════════════════════════════════════════════════════════ */
function SectionTitle({ title, color }: { title: string; color: string }) {
  return (
    <div
      className="text-xs tracking-[0.4em] uppercase mb-8 text-white/40 font-semibold flex items-center gap-2"
      style={{ fontFamily: "var(--font-label)" }}
    >
      <div className="w-8 h-[2px]" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
      {title}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   主组件
   ═══════════════════════════════════════════════════════════════ */

export default function DimensionPanel({ faceId, onClose, onReroll, onNavigate }: DimensionPanelProps) {
  const face = DICE_FACES[faceId - 1];
  const [isRerolling, setIsRerolling] = useState(false);
  const [activeVisualVideoId, setActiveVisualVideoId] = useState<string | null>(null);
  const [visualVideoVisibleCount, setVisualVideoVisibleCount] = useState(VISUAL_VIDEO_PAGE_SIZE);
  const [visualImageVisibleCount, setVisualImageVisibleCount] = useState(VISUAL_IMAGE_PAGE_SIZE);
  const rerollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const visualCdnBaseUrl =
    (import.meta.env.VITE_VISUAL_MEDIA_CDN_BASE_URL as string | undefined)?.trim() ||
    DEFAULT_VISUAL_CDN_BASE_URL;

  if (!face) return null;
  const isVisualFace = face.id === 1;
  const isEaster = face.id === 6;
  const hasVisualCdn = Boolean(visualCdnBaseUrl);
  const visibleVisualImages = VISUAL_IMAGE_ITEMS.slice(0, visualImageVisibleCount).filter((_, index) => {
    const displayRow = getVisualImageDisplayRow(index + 1);
    return !VISUAL_IMAGE_EXCLUDED_DISPLAY_ROWS.has(displayRow);
  });
  const visualImageSoloRows = visibleVisualImages.slice(0, 2);
  const visualImageGridRows = visibleVisualImages.slice(2);
  const isolatedGridRowStartIndex =
    VISUAL_IMAGE_ISOLATED_GRID_ROW_INDEX * VISUAL_IMAGE_GRID_COLUMN_COUNT;
  const visualImageGridRowsBeforeIsolated = visualImageGridRows.slice(0, isolatedGridRowStartIndex);
  const visualImageIsolatedRow = visualImageGridRows.slice(
    isolatedGridRowStartIndex,
    isolatedGridRowStartIndex + VISUAL_IMAGE_GRID_COLUMN_COUNT
  );
  const visualImageGridRowsAfterIsolated = visualImageGridRows.slice(
    isolatedGridRowStartIndex + VISUAL_IMAGE_GRID_COLUMN_COUNT
  );
  const visibleVisualVideos = VISUAL_VIDEO_ITEMS.slice(0, visualVideoVisibleCount);
  const hasMoreVisualImages = visualImageVisibleCount < VISUAL_IMAGE_ITEMS.length;
  const hasMoreVisualVideos = visualVideoVisibleCount < VISUAL_VIDEO_ITEMS.length;

  useEffect(() => {
    return () => {
      if (rerollTimeoutRef.current) {
        clearTimeout(rerollTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    setActiveVisualVideoId(null);
    setVisualVideoVisibleCount(VISUAL_VIDEO_PAGE_SIZE);
    setVisualImageVisibleCount(VISUAL_IMAGE_PAGE_SIZE);
  }, [faceId]);

  const handleReroll = () => {
    if (isRerolling) return;
    setIsRerolling(true);
    if (rerollTimeoutRef.current) {
      clearTimeout(rerollTimeoutRef.current);
    }
    rerollTimeoutRef.current = setTimeout(() => {
      let nextFaceId = faceId;
      while (nextFaceId === faceId) {
        nextFaceId = Math.floor(Math.random() * DICE_FACES.length) + 1;
      }
      setIsRerolling(false);
      onReroll(nextFaceId);
    }, REROLL_ANIM_DURATION_MS);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-[#080808]"
    >
      <div ref={scrollContainerRef} className="absolute inset-0 overflow-y-auto">
        {/* 顶部彩色线条 */}
        <div
          className="fixed top-0 left-0 right-0 h-[3px] z-50"
          style={{ 
            background: `linear-gradient(90deg, ${face.color}, ${face.color}80, ${face.color})`,
            boxShadow: `0 0 20px ${face.color}60`,
          }}
        />

        <div className="min-h-screen flex flex-col">
          {/* 头部导航 */}
          <header className="flex items-center justify-between px-6 md:px-12 py-6 backdrop-blur-sm">
            <button
              onClick={onClose}
              className="flex items-center gap-4 px-4 py-2.5 text-white/50 hover:text-white transition-colors duration-200 group"
            >
              <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform duration-200" />
              <span
                className="text-base tracking-[0.2em] uppercase font-semibold"
                style={{ fontFamily: "var(--font-label)" }}
              >
                返回主页
              </span>
            </button>

            <div className="flex items-center gap-5">
              <div className="flex flex-col items-center gap-1.5">
                <motion.button
                  onClick={handleReroll}
                  disabled={isRerolling}
                  className="group relative inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/22 bg-black/80
                             transition-all duration-250 hover:scale-105 hover:border-white/45"
                  style={{
                    boxShadow: `0 0 18px ${face.color}38, inset 0 0 24px ${face.color}1a`,
                  }}
                  animate={
                    isRerolling
                      ? { rotate: [0, 18, -18, 14, -14, 8, -8, 0], scale: [1, 1.08, 0.96, 1.05, 1] }
                      : { rotate: 0, scale: 1 }
                  }
                  transition={{ duration: 0.9, ease: "easeInOut" }}
                >
                  <motion.span
                    className="pointer-events-none absolute inset-[9px] grid grid-cols-3 grid-rows-3 place-items-center opacity-90"
                    animate={isRerolling ? { opacity: [0.55, 1, 0.55] } : { opacity: 0.9 }}
                    transition={{ duration: 0.55, repeat: isRerolling ? Infinity : 0, ease: "easeInOut" }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: face.color }} />
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: face.color, gridColumn: "3 / 4" }} />
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: face.color, gridColumn: "2 / 3", gridRow: "2 / 3" }} />
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: face.color, gridColumn: "1 / 2", gridRow: "3 / 4" }} />
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: face.color, gridColumn: "3 / 4", gridRow: "3 / 4" }} />
                  </motion.span>
                  <motion.span
                    className="relative z-10"
                    animate={isRerolling ? { rotate: [0, 180, 360] } : { rotate: 0 }}
                    transition={{ duration: 0.85, ease: "easeInOut" }}
                  >
                    <Dices
                      size={16}
                      className="text-white/90 transition-transform duration-250 group-hover:rotate-12"
                    />
                  </motion.span>
                </motion.button>
                <span
                  className="text-[10px] tracking-[0.24em] uppercase text-white/62"
                  style={{ fontFamily: "var(--font-label)" }}
                >
                  {isRerolling ? "随机跳转中" : "再掷一次"}
                </span>
              </div>
            </div>
          </header>

          {/* 主要内容区 */}
          <main className={isVisualFace ? "flex-1 px-3 md:px-4 lg:px-6 pb-16" : "flex-1 px-6 md:px-12 lg:px-20 pb-16"}>
            <div className={isVisualFace ? "max-w-none mx-auto" : "max-w-7xl mx-auto"}>

              {/* ═══ 视觉分支 ═══ */}
              {isVisualFace && (
                <div className="grid grid-cols-1 pt-4">
                  <div className="space-y-8">

                    {/* Visual Hero 区域 */}
                    <div className="px-3 md:px-8 lg:px-16 mb-8">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                      >
                        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
                          {/* 左侧：标题区 */}
                          <div className="space-y-6">
                            <div
                              className="text-xs tracking-[0.4em] uppercase font-semibold"
                              style={{ fontFamily: "var(--font-label)", color: `${face.color}cc` }}
                            >
                              {face.subtitle}
                            </div>
                            {face.coreStatement && (
                              <div
                                className="text-lg md:text-xl font-medium leading-relaxed"
                                style={{ color: `${face.color}DD` }}
                              >
                                {face.coreStatement}
                              </div>
                            )}
                          </div>

                          {/* 右侧：能力标签 + 数据亮点 */}
                          <div className="space-y-8">
                            {face.stats && face.stats.length > 0 && (
                              <StatsGrid stats={face.stats} color={face.color} />
                            )}
                          </div>
                        </div>
                      </motion.div>

                      {/* 分隔线 */}
                      <div className="h-[1px] mt-12 mb-8" style={{ background: `linear-gradient(90deg, transparent, ${face.color}30, transparent)` }} />

                      {/* 重点项目 */}
                      {face.works.length > 0 && (
                        <div className="mb-8">
                          <SectionTitle title="FEATURED PROJECTS" color={face.color} />
                          <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                          >
                            {face.works.map((work, i) => (
                              <WorkCard key={i} work={work} color={face.color} index={i} />
                            ))}
                          </motion.div>
                        </div>
                      )}

                      {/* 分隔线 */}
                      <div className="h-[1px] mt-8 mb-4" style={{ background: `linear-gradient(90deg, transparent, ${face.color}30, transparent)` }} />
                    </div>

                    {/* 图片和视频区域 — 完全保留原始代码 */}
                    <div>
                      {!hasVisualCdn && (
                        <div
                          className="mb-5 rounded-xl border px-4 py-3 text-sm text-white/70"
                          style={{
                            borderColor: `${face.color}40`,
                            background: `linear-gradient(135deg, ${face.color}10, rgba(255,255,255,0.03))`,
                          }}
                        >
                          未检测到视频 CDN 地址。请在 `.env` 中配置 `VITE_VISUAL_MEDIA_CDN_BASE_URL`。
                        </div>
                      )}

                      <div className="space-y-6">
                        <div className="space-y-16">
                          {visualImageSoloRows.map((item, index) => {
                            const imageUrl = buildVisualImageUrl(visualCdnBaseUrl, item.fileName);
                            return (
                              <div
                                key={item.id}
                                className={`${index === 0 ? "aspect-[4/3]" : "aspect-[16/9]"} rounded-none relative overflow-hidden`}
                                style={{
                                  background: `linear-gradient(135deg, ${face.color}10, ${face.color}05)`,
                                }}
                              >
                                {imageUrl && (
                                  <img
                                    src={imageUrl}
                                    alt={item.title}
                                    loading="lazy"
                                    className="absolute inset-0 h-full w-full object-cover z-0"
                                  />
                                )}
                                <div
                                  className="absolute inset-0 z-10 pointer-events-none"
                                  style={{
                                    background: "linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.15))",
                                  }}
                                />
                              </div>
                            );
                          })}

                          {visualImageGridRowsBeforeIsolated.length > 0 && (
                            <div className="grid grid-cols-3 gap-x-4 gap-y-16">
                              {visualImageGridRowsBeforeIsolated.map((item) => {
                                const imageUrl = buildVisualImageUrl(visualCdnBaseUrl, item.fileName);
                                return (
                                  <div
                                    key={item.id}
                                    className="aspect-[4/3] rounded-none relative overflow-hidden"
                                    style={{
                                      background: `linear-gradient(135deg, ${face.color}10, ${face.color}05)`,
                                    }}
                                  >
                                    {imageUrl && (
                                      <img
                                        src={imageUrl}
                                        alt={item.title}
                                        loading="lazy"
                                        className="absolute inset-0 h-full w-full object-cover z-0"
                                      />
                                    )}
                                    <div
                                      className="absolute inset-0 z-10 pointer-events-none"
                                      style={{
                                        background: "linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.15))",
                                      }}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {visualImageIsolatedRow.length > 0 && (
                            <div className="grid grid-cols-3 gap-x-4">
                              {visualImageIsolatedRow.map((item) => {
                                const imageUrl = buildVisualImageUrl(visualCdnBaseUrl, item.fileName);
                                return (
                                  <div
                                    key={item.id}
                                    className="aspect-[4/3] rounded-none relative overflow-hidden"
                                    style={{
                                      background: `linear-gradient(135deg, ${face.color}10, ${face.color}05)`,
                                    }}
                                  >
                                    {imageUrl && (
                                      <img
                                        src={imageUrl}
                                        alt={item.title}
                                        loading="lazy"
                                        className="absolute inset-0 h-full w-full object-cover z-0"
                                      />
                                    )}
                                    <div
                                      className="absolute inset-0 z-10 pointer-events-none"
                                      style={{
                                        background: "linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.15))",
                                      }}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {visualImageGridRowsAfterIsolated.length > 0 && (
                            <div className="grid grid-cols-3 gap-x-4 gap-y-16">
                              {visualImageGridRowsAfterIsolated.map((item) => {
                                const imageUrl = buildVisualImageUrl(visualCdnBaseUrl, item.fileName);
                                return (
                                  <div
                                    key={item.id}
                                    className="aspect-[4/3] rounded-none relative overflow-hidden"
                                    style={{
                                      background: `linear-gradient(135deg, ${face.color}10, ${face.color}05)`,
                                    }}
                                  >
                                    {imageUrl && (
                                      <img
                                        src={imageUrl}
                                        alt={item.title}
                                        loading="lazy"
                                        className="absolute inset-0 h-full w-full object-cover z-0"
                                      />
                                    )}
                                    <div
                                      className="absolute inset-0 z-10 pointer-events-none"
                                      style={{
                                        background: "linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.15))",
                                      }}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {hasMoreVisualImages && (
                          <div className="mt-5 flex justify-center">
                            <button
                              type="button"
                              onClick={() =>
                                setVisualImageVisibleCount((count) =>
                                  Math.min(count + VISUAL_IMAGE_PAGE_SIZE, VISUAL_IMAGE_ITEMS.length)
                                )
                              }
                              className="rounded-full h-11 w-11 text-xl font-semibold transition-all duration-200 hover:scale-105"
                              style={{
                                color: "white",
                                border: `1px solid ${face.color}55`,
                                background: `linear-gradient(135deg, ${face.color}45, rgba(0,0,0,0.5))`,
                              }}
                              aria-label="加载更多图片"
                            >
                              +
                            </button>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {visibleVisualVideos.map((item) => {
                            const videoUrl = buildVisualVideoUrl(visualCdnBaseUrl, item.fileName);
                            const posterUrl = buildVisualPosterUrl(visualCdnBaseUrl, item.fileName);
                            const isVideoOpen = activeVisualVideoId === item.id;
                            return (
                              <div
                                key={item.id}
                                className="aspect-[16/9] rounded-xl group transition-all duration-300 relative overflow-hidden hover:scale-[1.02] cursor-pointer"
                                style={{
                                  background: `linear-gradient(135deg, ${face.color}10, ${face.color}05)`,
                                }}
                                onClick={() => {
                                  if (!videoUrl || isVideoOpen) return;
                                  setActiveVisualVideoId(item.id);
                                }}
                              >
                                {isVideoOpen && videoUrl ? (
                                  <>
                                    <video
                                      className="h-full w-full object-cover"
                                      controls
                                      preload="none"
                                      playsInline
                                      src={videoUrl}
                                      poster={posterUrl ?? undefined}
                                    />
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        setActiveVisualVideoId(null);
                                      }}
                                      className="absolute top-2 right-2 z-20 h-7 w-7 rounded-full text-white/85 bg-black/55 hover:bg-black/70 transition-colors"
                                      aria-label="关闭视频"
                                    >
                                      x
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    {posterUrl && (
                                      <img
                                        src={posterUrl}
                                        alt={item.title}
                                        loading="lazy"
                                        className="absolute inset-0 h-full w-full object-cover z-0"
                                      />
                                    )}
                                    <div
                                      className="absolute inset-0 z-10 transition-opacity duration-500 opacity-65 group-hover:opacity-80"
                                      style={{
                                        background: posterUrl
                                          ? "linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.55))"
                                          : `radial-gradient(circle at center, ${face.color}20, transparent)`,
                                      }}
                                    />
                                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4">
                                      <div
                                        className="text-5xl transition-transform duration-300 group-hover:scale-110"
                                        style={{ color: "rgba(255,255,255,0.85)" }}
                                      >
                                        ▶
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {hasMoreVisualVideos && (
                          <div className="mt-5 flex justify-center">
                            <button
                              type="button"
                              onClick={() =>
                                setVisualVideoVisibleCount((count) =>
                                  Math.min(count + VISUAL_VIDEO_PAGE_SIZE, VISUAL_VIDEO_ITEMS.length)
                                )
                              }
                              className="rounded-full h-11 w-11 text-xl font-semibold transition-all duration-200 hover:scale-105"
                              style={{
                                color: "white",
                                border: `1px solid ${face.color}55`,
                                background: `linear-gradient(135deg, ${face.color}45, rgba(0,0,0,0.5))`,
                              }}
                              aria-label="加载更多视频"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ 非视觉分支（产品/算法/系统/跨界/未来）═══ */}
              {!isVisualFace && (
                <div className="pt-4 lg:pt-8">
                  {/* Hero 区域 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-12 lg:mb-16"
                  >
                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
                      {/* 左侧：标题区 */}
                      <div className="space-y-6">
                        {/* 副标题 */}
                        <div
                          className="text-xs tracking-[0.4em] uppercase font-semibold"
                          style={{ fontFamily: "var(--font-label)", color: `${face.color}cc` }}
                        >
                          {face.subtitle}
                        </div>

                        {/* 标题 */}
                        <h1
                          className="text-5xl sm:text-6xl md:text-7xl font-black text-white leading-[0.95] tracking-tight"
                          style={{ 
                            fontFamily: "var(--font-display)",
                            textShadow: `0 0 60px ${face.color}30`,
                          }}
                        >
                          {face.title}
                        </h1>

                        {/* 核心观点 */}
                        {face.coreStatement && (
                          <div
                            className="text-lg md:text-xl font-medium leading-relaxed"
                            style={{ color: `${face.color}DD` }}
                          >
                            {face.coreStatement}
                          </div>
                        )}

                        {/* 描述 */}
                        {face.description && (
                          <p
                            className="text-white/55 text-base md:text-lg leading-relaxed"
                            style={{ fontFamily: "var(--font-body)" }}
                          >
                            {face.description}
                          </p>
                        )}

                        {/* 引用 */}
                        {face.quote && (
                          <div
                            className="pl-4 py-2 text-sm text-white/40 italic leading-relaxed"
                            style={{ 
                              borderLeft: `2px solid ${face.color}50`,
                              background: `linear-gradient(90deg, ${face.color}05, transparent)`,
                            }}
                          >
                            <Sparkles size={14} className="inline mb-1 mr-1" style={{ color: face.color }} />
                            "{face.quote}"
                          </div>
                        )}
                      </div>

                      {/* 右侧：技能标签 + 统计数据 */}
                      <div className="space-y-8">
                        {/* 技能标签 */}
                        {face.skills.length > 0 && (
                          <div>
                            <div
                              className="text-xs tracking-[0.4em] uppercase mb-5 text-white/40 font-semibold flex items-center gap-2"
                              style={{ fontFamily: "var(--font-label)" }}
                            >
                              <div className="w-8 h-[2px]" style={{ background: `linear-gradient(90deg, ${face.color}, transparent)` }} />
                              SKILL SET
                            </div>
                            <div className="flex flex-wrap gap-3">
                              {face.skills.map((skill) => (
                                <span
                                  key={skill}
                                  className="px-5 py-2.5 text-sm font-medium rounded-full transition-all duration-300 hover:scale-105 cursor-default"
                                  style={{
                                    color: `${face.color}`,
                                    background: `${face.color}15`,
                                    boxShadow: `0 0 20px ${face.color}10`,
                                  }}
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 统计数据 */}
                        {face.stats && face.stats.length > 0 && (
                          <StatsGrid stats={face.stats} color={face.color} />
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {/* 分隔线 */}
                  <div className="h-[1px] mb-12 lg:mb-16" style={{ background: `linear-gradient(90deg, transparent, ${face.color}30, transparent)` }} />

                  {/* ─── 产品分支：作品/案例区 ─── */}
                  {face.id === 2 && face.works.length > 0 && (
                    <div className="mb-12 lg:mb-16">
                      <SectionTitle title="INNOVATION CASES" color={face.color} />
                      <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                      >
                        {face.works.map((work, i) => (
                          <WorkCard key={i} work={work} color={face.color} index={i} />
                        ))}
                      </motion.div>
                    </div>
                  )}

                  {/* ─── 算法分支：知识体系链条 + 技术应用 + 编程语言 ─── */}
                  {face.id === 3 && (
                    <>
                      {face.knowledgeChain && (
                        <div className="mb-12 lg:mb-16">
                          <SectionTitle title="KNOWLEDGE ARCHITECTURE" color={face.color} />
                          <div className="max-w-2xl mx-auto">
                            <KnowledgeChain chain={face.knowledgeChain} color={face.color} />
                          </div>
                        </div>
                      )}

                      {face.mathAssignments && face.mathAssignments.length > 0 && (
                        <div className="mb-12 lg:mb-16">
                          <SectionTitle title="MATH FOUNDATIONS" color={face.color} />
                          <MathAssignmentsPanel assignments={face.mathAssignments} color={face.color} />
                        </div>
                      )}

                      {face.techApplications && (
                        <div className="mb-12 lg:mb-16">
                          <SectionTitle title="TECH APPLICATIONS" color={face.color} />
                          <TechApplications apps={face.techApplications} color={face.color} />
                        </div>
                      )}

                    </>
                  )}

                  {/* ─── 系统分支：课程训练 + 系统能力 + 实际应用 ─── */}
                  {face.id === 4 && (
                    <>
                      {face.systemCourses && (
                        <div className="mb-12 lg:mb-16">
                          <SectionTitle title="SYSTEM COURSE TRAINING" color={face.color} />
                          <div
                            className="rounded-2xl px-6 py-6 md:px-8 md:py-8 relative overflow-hidden"
                            style={{
                              background: `linear-gradient(135deg, ${face.color}0A, ${face.color}04)`,
                              border: `1px solid ${face.color}20`,
                            }}
                          >
                            <div className="relative z-10">
                              <div
                                className="text-sm font-semibold mb-5 tracking-[0.15em]"
                                style={{ color: `${face.color}BB`, fontFamily: "var(--font-label)" }}
                              >
                                计算机系统底层
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {face.systemCourses.map((course) => (
                                  <div
                                    key={course.code}
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg"
                                    style={{ border: `1px solid ${face.color}15`, background: `${face.color}08` }}
                                  >
                                    <span className="text-xs font-mono font-semibold tracking-wider" style={{ color: `${face.color}CC` }}>
                                      {course.code}
                                    </span>
                                    <span className="text-sm text-white/60">{course.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {face.systemCapabilities && (
                        <div className="mb-12 lg:mb-16">
                          <SectionTitle title="SYSTEM CAPABILITIES" color={face.color} />
                          <SystemCapabilityCards capabilities={face.systemCapabilities} color={face.color} />
                        </div>
                      )}

                      <div className="mb-12 lg:mb-16">
                        <SectionTitle title="PROGRAMMING LANGUAGE CAPABILITY" color={face.color} />
                        <ProgrammingLanguageCapability color={face.color} />
                      </div>

                      {/* 系统仓库 */}
                      <div className="mb-12 lg:mb-16">
                        <SectionTitle title="SYSTEM REPOSITORY" color={face.color} />
                        <div
                          className="rounded-2xl px-6 py-8 md:px-8 md:py-10 relative overflow-hidden"
                          style={{
                            background: `linear-gradient(135deg, ${face.color}12, ${face.color}06)`,
                            border: `1px solid ${face.color}30`,
                          }}
                        >
                          <div
                            className="absolute inset-0 opacity-20"
                            style={{ background: `radial-gradient(circle at 80% 20%, ${face.color}30, transparent 60%)` }}
                          />
                          <div className="relative z-10">
                            <div
                              className="text-lg md:text-xl font-semibold tracking-[0.08em]"
                              style={{
                                fontFamily: "var(--font-label)",
                                color: `${face.color}E6`,
                              }}
                            >
                              岱的系统架构仓库
                            </div>
                            <p
                              className="mt-4 text-sm md:text-base leading-relaxed text-white/80"
                              style={{ fontFamily: "var(--font-body)" }}
                            >
                              复杂项目的系统架构设计 · 数据库设计与管理能力
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ─── 跨界分支：教育轨迹 + 优势 ─── */}
                  {face.id === 5 && (
                    <>
                      {face.educationTimeline && (
                        <div className="mb-12 lg:mb-16">
                          <SectionTitle title="EDUCATION TRAJECTORY" color={face.color} />
                          <div className="max-w-2xl">
                            <EducationTimeline timeline={face.educationTimeline} color={face.color} />
                          </div>
                        </div>
                      )}

                      {face.hybridAdvantages && (
                        <div className="mb-12 lg:mb-16">
                          <SectionTitle title="UNIQUE ADVANTAGES" color={face.color} />
                          <HybridAdvantages advantages={face.hybridAdvantages} color={face.color} />
                          <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="mt-8 text-center"
                          >
                            <div
                              className="inline-block px-6 py-3 rounded-full text-sm font-medium"
                              style={{
                                color: `${face.color}DD`,
                                background: `${face.color}10`,
                                border: `1px solid ${face.color}25`,
                              }}
                            >
                              技术艺术化转化能力 · 跨领域创新解决方案
                            </div>
                          </motion.div>
                        </div>
                      )}
                    </>
                  )}

                  {/* ─── 未来分支：探索方向 + 小游戏 ─── */}
                  {isEaster && (
                    <div className="mb-12 lg:mb-16">
                      {/* 探索方向 */}
                      {face.futureDirections && (
                        <div className="mb-12">
                          <SectionTitle title="EXPLORING DIRECTIONS" color={face.color} />
                          <FutureDirections directions={face.futureDirections} color={face.color} />
                        </div>
                      )}

                      {/* 小游戏占位区 */}
                      <div
                        className="rounded-2xl p-6 md:p-8 relative overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${face.color}14, ${face.color}06)`,
                          border: `1px solid ${face.color}35`,
                        }}
                      >
                        <div
                          className="absolute inset-0 opacity-15"
                          style={{
                            background: `radial-gradient(circle at 22% 35%, ${face.color}45, transparent 52%)`,
                          }}
                        />
                        
                        <div className="relative z-10">
                          <div className="flex items-start justify-between gap-4 mb-5">
                            <div>
                              <div
                                className="text-xs tracking-[0.35em] uppercase font-semibold"
                                style={{ fontFamily: "var(--font-label)", color: `${face.color}B8` }}
                              >
                                MINI GAME
                              </div>
                              <h3
                                className="mt-2 text-2xl md:text-3xl font-semibold text-white"
                                style={{ fontFamily: "var(--font-display)" }}
                              >
                                岱和她的朋友们
                              </h3>
                            </div>
                            <span
                              className="text-[11px] md:text-xs px-3 py-1.5 rounded-full tracking-[0.2em] uppercase font-semibold"
                              style={{
                                fontFamily: "var(--font-label)",
                                color: `${face.color}E0`,
                                border: `1px solid ${face.color}45`,
                                background: `${face.color}12`,
                              }}
                            >
                              Coming Soon
                            </span>
                          </div>

                          <div className="grid md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4">
                            <div
                              className="aspect-[16/9] rounded-xl relative overflow-hidden"
                              style={{
                                background: "linear-gradient(140deg, rgba(255,255,255,0.05), rgba(0,0,0,0.28))",
                                border: `1px solid ${face.color}30`,
                              }}
                            >
                              <motion.div
                                className="absolute inset-0"
                                animate={{ opacity: [0.18, 0.3, 0.18] }}
                                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                                style={{
                                  background: `radial-gradient(circle at 50% 55%, ${face.color}50, transparent 62%)`,
                                }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center text-center px-6">
                                <p
                                  className="text-base md:text-lg text-white/85 leading-relaxed"
                                  style={{ fontFamily: "var(--font-body)" }}
                                >
                                  小游戏主界面预留区
                                  <br />
                                  玩法开发中
                                </p>
                              </div>
                            </div>

                            <div
                              className="rounded-xl p-4 flex flex-col gap-3"
                              style={{
                                background: "linear-gradient(140deg, rgba(255,255,255,0.04), rgba(0,0,0,0.35))",
                                border: `1px solid ${face.color}2E`,
                              }}
                            >
                              <div
                                className="text-[11px] tracking-[0.3em] uppercase font-semibold"
                                style={{ fontFamily: "var(--font-label)", color: `${face.color}AA` }}
                              >
                                Interface
                              </div>
                              <div className="space-y-2">
                                <div className="h-9 rounded-lg border border-white/10 bg-black/25" />
                                <div className="h-9 rounded-lg border border-white/10 bg-black/25" />
                                <div className="h-9 rounded-lg border border-white/10 bg-black/25" />
                              </div>
                              <button
                                type="button"
                                disabled
                                className="mt-1 w-full h-10 rounded-lg text-sm font-semibold text-white/70 cursor-not-allowed"
                                style={{
                                  fontFamily: "var(--font-label)",
                                  background: `${face.color}22`,
                                  border: `1px solid ${face.color}35`,
                                }}
                              >
                                开始游戏（待开放）
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 联系方式 */}
                      {face.contactInfo && face.contactInfo.length > 0 && (
                        <div className="mt-12">
                          <SectionTitle title="CONTACT" color={face.color} />
                          <ContactSection contactInfo={face.contactInfo} color={face.color} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* 下一个维度导航 */}
                  <div className="flex justify-end pt-4 pb-4">
                    <NextDimensionNav currentId={face.id} color={face.color} onNavigate={onNavigate} />
                  </div>
                </div>
              )}
            </div>
          </main>

          {/* 底部指示器 */}
          <div className="flex items-center justify-center gap-3 pb-8">
            {DICE_FACES.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  if (f.id !== faceId) onNavigate(f.id);
                }}
                className="rounded-full transition-all duration-300 cursor-pointer hover:scale-150"
                style={{
                  width: f.id === faceId ? "8px" : "4px",
                  height: f.id === faceId ? "8px" : "4px",
                  backgroundColor: f.id === faceId ? face.color : "rgba(255,255,255,0.15)",
                  boxShadow: f.id === faceId ? `0 0 10px ${face.color}80` : "none",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

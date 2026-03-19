/*
 * Dimension Panel — 全屏维度展示
 * 更现代的设计，更好的动画过渡
 */

import { useEffect, useRef, useState } from "react";
import type { ReactNode, SVGProps } from "react";
import { AnimatePresence, motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { DICE_FACES } from "@/lib/diceData";
import type { DiceFace, WorkItem } from "@/lib/diceData";
import { ArrowLeft, Dices, Sparkles, ExternalLink, ChevronRight, ChevronDown } from "lucide-react";
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
const MOTION_EASE_OUT = [0.22, 1, 0.36, 1] as const;

type PaperSpotlightItem = {
  title: string;
  noteDate: string;
  note: string;
};

// 中文注释：算法分支的 Paper Spotlight 卡片默认数据（后续可直接替换）
const ALGORITHM_PAPER_SPOTLIGHT_ITEMS: PaperSpotlightItem[] = [
  {
    // 中文注释：按需求替换为 Attention Residuals 的完整长文笔记
    title: "《深度解读：Attention Residuals（注意力残差）》",
    noteDate: "2026-03-19",
    note: `# 深度解读：Attention Residuals（注意力残差）

## 前置

要真正读懂《Attention Residuals》这篇论文，你需要对以下几个核心概念有扎实的理解。

### 1. Transformer 架构与残差连接

Transformer 是现代大语言模型的基础架构。在 Transformer 中，每一层都包含两个主要组件：自注意力机制（Self-Attention）和前馈神经网络（FFN）。而**残差连接**（Residual Connection）是让这个深层网络能够成功训练的关键技术。

残差连接的基本思想非常简单：不是让网络直接学习从输入到输出的映射，而是学习一个“残差”——也就是输出与输入之间的差异。数学上表示为：

$\\text{output} = \\text{input} + \\text{Layer}(\\text{input})$

这个简单的设计解决了深度神经网络训练中的梯度消失问题，让我们能够堆叠几十甚至上百层网络。

### 2. PreNorm vs PostNorm

在 Transformer 中，Layer Normalization（层归一化）的位置有两种主流方案：

- **PostNorm**（原始 Transformer 设计）：先做子层计算，再做归一化，最后加残差

  - 公式：$x_{l+1} = \\text{LN}(x_l + \\text{Layer}(x_l))$

  - 问题：深层网络梯度容易消失，训练不稳定

- **PreNorm**（现代 LLM 标配）：先归一化，再做子层计算，最后加残差

  - 公式：$x_{l+1} = x_l + \\text{Layer}(\\text{LN}(x_l))$

  - 优势：训练更稳定，梯度流动更顺畅

  - 问题：这正是 Attention Residuals 要解决的核心痛点

### 3. PreNorm 的“稀释问题”

PreNorm 虽然让训练变得稳定，但引入了一个微妙而严重的问题：**层贡献的逐层稀释**。

想象一下，你有一个 100 层的网络。在 PreNorm 架构下，每一层的输出都以**固定权重 1** 累加到下一层：

$x_L = x_0 + \\sum_{l=1}^{L} \\text{Layer}_l(\\text{LN}(x_l))$

这意味着什么？随着网络加深：

- 隐藏状态的幅度不断增长（从 $x_0$ 一直加到 $x_L$）

- 每一层的贡献被“平均”稀释——第 1 层的输出要和后面 99 层的输出“平分秋色”

- 越深的层，想要对最终输出产生显著影响就越困难

这就像一个会议，前面的发言者说了一句话，后面 99 个人每人也说一句话，最后所有话等权重混在一起——前面的声音自然就被淹没了。

### 4. 注意力机制的本质

注意力机制（Attention）的核心思想是：**不是所有信息都同等重要，模型应该学会动态地“关注”最相关的部分**。

在 Transformer 的序列维度上，注意力机制通过 Query-Key-Value 机制，让模型能够：

- 根据当前 token（Query）

- 在所有历史 token（Key）中检索

- 用学习到的权重（通过 softmax 归一化）聚合信息（Value）

这个机制的威力在于：权重是**输入相关的**（input-dependent）和**可学习的**（learned），而不是固定的。

---

## Attention Residuals：核心创新到底是什么？

理解了上述前置知识后，Attention Residuals 的核心思想就呼之欲出了：**既然注意力机制在序列维度（横向）上如此成功，为什么不在深度维度（纵向）上也用注意力机制来替代固定的残差累加？**

### 问题的本质

传统残差连接的问题在于：

- 所有层的输出以**固定权重 1** 累加

- 无论输入是什么，累加方式都是机械的、均匀的

- 模型无法根据当前任务动态调整“应该更多地依赖哪一层的信息”

这就像你在写一篇文章时，必须把所有草稿的每一版都等权重地混合在一起——显然不合理。有时候你需要第 3 版的开头，有时候需要第 7 版的结论，而不是把所有版本平均混合。

### Attention Residuals 的解决方案

Kimi 团队提出的方案极其优雅：**用 softmax 注意力替代固定累加**。

**Full Attention Residuals** 的公式是：

$x_{l+1} = \\sum_{i=0}^{l} \\alpha_{l,i} \\cdot x_i$

其中权重 $\\alpha_{l,i}$ 通过注意力机制计算：

$\\alpha_{l,i} = \\frac{\\exp(q_l^T k_i)}{\\sum_{j=0}^{l} \\exp(q_l^T k_j)}$

这里：

- $q_l$ 是当前层的 query（从当前隐藏状态生成）

- $k_i$ 是第 $i$ 层的 key（从该层的输出生成）

- 权重通过 softmax 归一化，确保和为 1

**这意味着什么？** 每一层现在可以：

1. **动态选择**：根据当前输入，决定应该更多地依赖哪些前面的层

2. **学习权重**：这些选择不是人为设定的，而是在训练中学习出来的

3. **输入相关**：不同的输入会导致不同的层选择策略

### 一个直观的类比

想象你在解一道数学题：

- **传统残差连接**：你必须把草稿纸上的每一步计算都等权重地“平均”起来作为答案

- **Attention Residuals**：你可以智能地选择——“这道题的关键在第 3 步和第 7 步，我主要用这两步的结果，其他步骤权重降低”

这就是从“机械累加”到“智能检索”的范式转变。

---

## 工程化挑战与 Block AttnRes

理论上，Full Attention Residuals 很完美。但在实际的大规模模型训练中，它面临一个致命问题：**内存和通信开销**。

### 问题分析

假设你有一个 100 层的网络，每层的隐藏状态维度是 $d$：

- Full AttnRes 需要在每一层存储**所有前面层的输出**

- 内存复杂度：$O(L \\times d)$，其中 $L$ 是层数

- 对于 48B 参数的模型，这个开销是不可接受的

在分布式训练（尤其是流水线并行）中，这还会导致大量的跨设备通信开销。

### Block Attention Residuals：务实的折中

Kimi 团队提出了 **Block AttnRes**，这是一个工程化的解决方案：

1. **分块策略**：将 $L$ 层网络划分为 $N$ 个块（Block）

2. **块内标准残差**：在每个块内部，仍然使用传统的固定权重残差连接

3. **块间注意力**：只在块的边界上，对这 $N$ 个块级表征执行注意力聚合

这样：

- 内存复杂度从 $O(L \\times d)$ 降低到 $O(N \\times d)$

- 如果 $N = 10$，$L = 100$，内存开销直接降低 10 倍

- 同时保留了大部分 Full AttnRes 的性能增益

### 关键的工程优化

论文还提出了两个重要的系统优化：

1. **缓存式流水线通信**：在流水线并行中，通过缓存机制减少跨设备的块级表征传输

2. **两阶段计算策略**：将注意力计算和残差聚合分离，优化计算效率

这些优化让 Block AttnRes 成为一个**可以直接替换标准残差连接的即插即用方案**，训练开销几乎可以忽略不计。

---

## 实验验证：真的有用吗？

Kimi 团队在真实的大规模预训练中验证了这个方案，这是最有说服力的部分。

### 训练配置

- **模型**：Kimi Linear 48B（总参数 48B，激活参数 3B 的 MoE 架构）

- **数据**：1.4 万亿 tokens 的预训练语料

- **对比**：标准残差连接 vs Block AttnRes

### 核心结果

1. **训练效率提升 25%**：在相同的计算预算下，AttnRes 模型的性能显著更好

2. **推理延迟仅增 2%**：几乎没有额外的推理开销

3. **Scaling Law 一致性**：在不同模型规模下，改进都是一致的

### 深层次的改进

更重要的是，AttnRes 从根本上改善了网络的内部动力学：

- **隐藏状态幅度更均匀**：不再出现 PreNorm 的无控制增长

- **梯度分布更平衡**：各层的梯度不再随深度剧烈衰减

- **层贡献更合理**：每一层都能对最终输出产生有意义的影响

这些改进不仅体现在最终的性能指标上，更体现在模型的**可训练性**和**可扩展性**上。

---

## Why is this job so important

### 1. 理论上的优雅统一

Attention Residuals 提供了一个**统一的视角**：

- Transformer 用注意力替代了 RNN 的序列递归（横向维度）

- AttnRes 用注意力替代了残差的固定累加（纵向维度）

这是一个完整的、对称的设计哲学。

### 2. 工程上的可落地性

与许多“纸面上很美”的研究不同，AttnRes：

- 真正在 48B 规模的模型上验证了

- 解决了内存、通信、计算的所有工程问题

- 提供了即插即用的实现方案

### 3. 对未来的启示

这个工作打开了一个新的研究方向：**深度维度的动态架构**。

未来可能的探索包括：

- 更复杂的深度注意力模式（不只是简单的 QKV）

- 自适应的块划分策略（根据任务动态调整块大小）

- 与其他架构创新（如 MoE、长上下文）的结合

---

## 总结：

《Attention Residuals》的核心贡献可以用一句话概括：

**把 Transformer 在序列维度上“用注意力替代递归”的成功经验，迁移到了深度维度上，用可学习的、输入相关的注意力聚合，替代了固定权重的残差累加。**

这不是一个小修小补的改进，而是对 Transformer 架构底层设计的重新思考。它解决了 PreNorm 架构中长期存在但被忽视的“层贡献稀释”问题，并且通过精巧的工程设计（Block AttnRes），让这个理论上优雅的方案在实际的大规模训练中真正可行。

对于深度学习研究者来说，这篇论文的价值在于：它提醒我们，即使是看似“已经定型”的架构组件（如残差连接），仍然有重新审视和改进的空间。而对于工程实践者来说，Block AttnRes 提供了一个可以立即尝试的、经过验证的方案，来提升模型的训练效率和最终性能。

这就是为什么这篇论文能够同时获得 Elon Musk 和 Andrej Karpathy 的盛赞——它既有理论深度，又有工程实用性，是真正推动领域前进的工作。`,
  },
];

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
    transition: { delay: i * 0.08, duration: 0.5, ease: MOTION_EASE_OUT },
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

/* ─── 算法课程实践组件（算法页专用）─── */
function AlgorithmCourseDetails({
  courses,
  color,
}: {
  courses: NonNullable<DiceFace["algorithmCourseDetails"]>;
  color: string;
}) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      {courses.map((course, index) => (
        <motion.div
          key={`${course.code}-${course.title}`}
          custom={index}
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="rounded-2xl p-5 md:p-6 space-y-5"
          style={{
            background: `linear-gradient(145deg, ${color}12, ${color}05)`,
            border: `1px solid ${color}24`,
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div
                className="text-[11px] tracking-[0.22em] uppercase font-semibold mb-2"
                style={{ color: `${color}C8`, fontFamily: "var(--font-label)" }}
              >
                {course.code}
              </div>
              <h3 className="text-2xl font-semibold text-white/92" style={{ fontFamily: "var(--font-display)" }}>
                {course.title}
              </h3>
            </div>
            <span
              className="px-3 py-1.5 rounded-full text-[10px] tracking-[0.16em] uppercase whitespace-nowrap"
              style={{ color: `${color}E8`, background: `${color}18`, border: `1px solid ${color}28` }}
            >
              {course.depth}
            </span>
          </div>

          <p className="text-sm leading-relaxed text-white/62">{course.summary}</p>

          <div className="space-y-2">
            {course.topics.map((topic) => (
              <div key={topic} className="flex items-start gap-2 text-sm text-white/66">
                <ChevronRight size={14} className="mt-0.5 shrink-0" style={{ color: `${color}8A` }} />
                <span>{topic}</span>
              </div>
            ))}
          </div>

          {course.practice && (
            <div
              className="rounded-xl p-4"
              style={{ background: `${color}0B`, border: `1px solid ${color}18` }}
            >
              <div
                className="text-[11px] tracking-[0.2em] uppercase font-semibold mb-2"
                style={{ color: `${color}BC`, fontFamily: "var(--font-label)" }}
              >
                Practice
              </div>
              <div className="text-sm text-white/78 leading-relaxed">{course.practice}</div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

/* ─── 算法技术应用组件（算法页专用）─── */
function AlgorithmApplicationAreas({
  areas,
  color,
}: {
  areas: NonNullable<DiceFace["algorithmApplicationAreas"]>;
  color: string;
}) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {areas.map((area, index) => (
        <motion.div
          key={area.title}
          custom={index}
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="rounded-2xl p-5 md:p-6 space-y-5"
          style={{
            background: `linear-gradient(145deg, ${color}10, ${color}05)`,
            border: `1px solid ${color}22`,
          }}
        >
          <div>
            <div
              className="text-[11px] tracking-[0.22em] uppercase font-semibold mb-2"
              style={{ color: `${color}C8`, fontFamily: "var(--font-label)" }}
            >
              {area.subtitle}
            </div>
            <h3 className="text-2xl font-semibold text-white/92 mb-2" style={{ fontFamily: "var(--font-display)" }}>
              {area.title}
            </h3>
            {area.description && <p className="text-sm text-white/60 leading-relaxed">{area.description}</p>}
          </div>

          <div className="space-y-4">
            {area.clusters.map((cluster) => (
              <div
                key={`${area.title}-${cluster.title}`}
                className="rounded-xl p-4"
                style={{ background: `${color}0B`, border: `1px solid ${color}18` }}
              >
                <div className="text-sm font-semibold text-white/85 mb-3">{cluster.title}</div>
                <div className="space-y-2">
                  {cluster.items.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-sm text-white/64">
                      <div className="mt-[7px] h-1.5 w-1.5 rounded-full shrink-0" style={{ background: `${color}90` }} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── 算法实战项目组件（算法页专用）─── */
function AlgorithmProjects({
  projects,
  color,
}: {
  projects: NonNullable<DiceFace["algorithmProjects"]>;
  color: string;
}) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {projects.map((project, index) => (
        <motion.div
          key={project.title}
          custom={index}
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          className="rounded-2xl p-6 md:p-7 space-y-6 relative overflow-hidden"
          style={{
            background: `linear-gradient(145deg, ${color}12, ${color}05)`,
            border: `1px solid ${color}24`,
          }}
        >
          <div
            className="absolute inset-0 opacity-35"
            style={{ background: `radial-gradient(circle at 90% 10%, ${color}22, transparent 48%)` }}
          />

          <div className="relative z-10 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div
                  className="text-[11px] tracking-[0.22em] uppercase font-semibold mb-2"
                  style={{ color: `${color}C8`, fontFamily: "var(--font-label)" }}
                >
                  {project.subtitle}
                </div>
                <h3 className="text-2xl md:text-3xl font-semibold text-white/92" style={{ fontFamily: "var(--font-display)" }}>
                  {project.title}
                </h3>
              </div>
              <span
                className="px-3 py-1.5 rounded-full text-[10px] tracking-[0.16em] uppercase whitespace-nowrap"
                style={{ color: `${color}E8`, background: `${color}18`, border: `1px solid ${color}28` }}
              >
                {project.status}
              </span>
            </div>

            <p className="text-sm md:text-base text-white/64 leading-relaxed">{project.summary}</p>

            <div className="flex flex-wrap gap-2">
              {project.techStack.map((item) => (
                <span
                  key={`${project.title}-${item}`}
                  className="px-3 py-1.5 rounded-full text-xs text-white/78"
                  style={{ background: `${color}14`, border: `1px solid ${color}22` }}
                >
                  {item}
                </span>
              ))}
            </div>

            {project.features && project.features.length > 0 && (
              <div
                className="rounded-xl p-4"
                style={{ background: `${color}0B`, border: `1px solid ${color}18` }}
              >
                <div
                  className="text-[11px] tracking-[0.2em] uppercase font-semibold mb-3"
                  style={{ color: `${color}BC`, fontFamily: "var(--font-label)" }}
                >
                  Features
                </div>
                <div className="flex flex-wrap gap-2">
                  {project.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-3 py-1.5 rounded-full text-xs text-white/72"
                      style={{ background: `${color}14`, border: `1px solid ${color}22` }}
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {project.architecture && project.architecture.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {project.architecture.map((item) => (
                  <div
                    key={`${project.title}-${item.title}`}
                    className="rounded-xl p-4"
                    style={{ background: `${color}0B`, border: `1px solid ${color}18` }}
                  >
                    <div className="text-sm font-semibold text-white/86 mb-2">{item.title}</div>
                    <p className="text-sm text-white/58 leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            )}

            {project.highlights && project.highlights.length > 0 && (
              <div className="space-y-2">
                {project.highlights.map((highlight) => (
                  <div key={highlight} className="flex items-start gap-2 text-sm text-white/68">
                    <ChevronRight size={14} className="mt-0.5 shrink-0" style={{ color: `${color}90` }} />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>
            )}

            {project.outcomes && project.outcomes.length > 0 && (
              <div
                className="rounded-xl p-4"
                style={{ background: `${color}0B`, border: `1px solid ${color}18` }}
              >
                <div
                  className="text-[11px] tracking-[0.2em] uppercase font-semibold mb-3"
                  style={{ color: `${color}BC`, fontFamily: "var(--font-label)" }}
                >
                  Outcomes
                </div>
                <div className="space-y-2">
                  {project.outcomes.map((outcome) => (
                    <div key={outcome} className="flex items-start gap-2 text-sm text-white/70">
                      <div className="mt-[7px] h-1.5 w-1.5 rounded-full shrink-0" style={{ background: `${color}96` }} />
                      <span>{outcome}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {project.openSourceNote && (
              <div
                className="rounded-xl px-4 py-3 text-sm text-white/76 leading-relaxed"
                style={{ background: `${color}10`, border: `1px solid ${color}20` }}
              >
                {project.openSourceNote}
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── 知识体系链条组件（算法页专用）─── */
function KnowledgeChain({ chain, color }: { chain: NonNullable<DiceFace["knowledgeChain"]>; color: string }) {
  // 中文注释：左侧目录当前选中项（默认第一个：数学基础）
  const [activeLevelIndex, setActiveLevelIndex] = useState(0);
  // 中文注释：右侧内容整体展开/收起
  const [isRightExpanded, setIsRightExpanded] = useState(true);

  useEffect(() => {
    if (activeLevelIndex >= chain.length) {
      setActiveLevelIndex(0);
    }
  }, [activeLevelIndex, chain.length]);

  const activeLevel = chain[activeLevelIndex] ?? chain[0];
  if (!activeLevel) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-4 lg:gap-6">
      {/* 中文注释：左侧知识结构目录 */}
      <div
        className="rounded-2xl p-3 md:p-4 h-fit"
        style={{
          background: `linear-gradient(145deg, ${color}10, ${color}04)`,
          border: `1px solid ${color}22`,
        }}
      >
        <div
          className="text-[11px] tracking-[0.24em] uppercase font-semibold mb-3 px-2"
          style={{ color: `${color}C8`, fontFamily: "var(--font-label)" }}
        >
          Structure
        </div>
        <div className="space-y-2">
          {chain.map((level, index) => {
            const isActive = index === activeLevelIndex;
            return (
              <button
                key={level.level}
                type="button"
                onClick={() => {
                  setActiveLevelIndex(index);
                  setIsRightExpanded(true);
                }}
                className="w-full text-left rounded-xl px-3 py-2.5 transition-all duration-200"
                style={{
                  color: isActive ? `${color}F0` : "rgba(255,255,255,0.66)",
                  background: isActive ? `${color}1E` : "transparent",
                  border: `1px solid ${isActive ? `${color}3A` : "rgba(255,255,255,0.08)"}`,
                }}
              >
                <div className="text-sm font-semibold">{level.level}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 中文注释：右侧内容区，支持整体收放 */}
      <motion.div
        key={activeLevel.level}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="rounded-2xl p-5 md:p-6 relative overflow-hidden"
        style={{
          // 中文注释：Knowledge System 右侧容器改成和 Paper Spotlight 一致的左亮右黑渐变风格
          background: `linear-gradient(90deg, ${color}34 0%, ${color}1c 26%, rgba(10,10,14,0.94) 62%, rgba(0,0,0,0.98) 100%)`,
        }}
      >
        {/* 中文注释：复用 Paper Spotlight 的动态光效层，保持视觉一致 */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 12% 52%, ${color}3a 0%, ${color}1e 24%, transparent 62%)`,
          }}
          animate={{ opacity: [0.42, 0.58, 0.42], scale: [1, 1.03, 1] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(90deg, ${color}1e 0%, transparent 34%, rgba(0,0,0,0.14) 100%)`,
          }}
          animate={{ opacity: [0.3, 0.18, 0.3] }}
          transition={{ duration: 6.2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* 中文注释：按需求移除右侧顶部“数学基础 / 收起内容”这一行 */}

        <AnimatePresence initial={false}>
          {isRightExpanded && (
            <motion.div
              key={`${activeLevel.level}-expanded`}
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="relative z-10 overflow-hidden"
            >
              {activeLevel.items.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {activeLevel.items.map((item) => (
                    <span
                      key={item}
                      className="px-3 py-1.5 text-xs rounded-full text-white/70"
                      style={{
                        background: `${color}14`,
                        border: `1px solid ${color}24`,
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}

              {activeLevel.papers && activeLevel.papers.length > 0 && (
                <div className="mt-5 space-y-3">
                  {activeLevel.papers.map((paper) => (
                    <details
                      key={`${activeLevel.level}-${paper.title}`}
                      className="group rounded-xl"
                      style={{ border: `1px solid ${color}18`, background: `${color}08` }}
                    >
                      <summary className="list-none cursor-pointer px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div
                            className="mt-1 h-2 w-2 rounded-full shrink-0 transition-transform duration-200 group-open:scale-125"
                            style={{ background: `${color}A0` }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-white/88 mb-1">{paper.title}</div>
                            <p className="text-xs md:text-sm leading-relaxed text-white/54">{paper.summary}</p>
                            {paper.keywords && paper.keywords.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {paper.keywords.map((keyword) => (
                                  <span
                                    key={`${paper.title}-${keyword}`}
                                    className="px-2.5 py-1 rounded-full text-[10px] tracking-[0.14em] uppercase text-white/70"
                                    style={{ background: `${color}14`, border: `1px solid ${color}20` }}
                                  >
                                    {keyword}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <ChevronDown
                            size={16}
                            className="mt-1 shrink-0 transition-transform duration-200 group-open:rotate-180"
                            style={{ color: `${color}80` }}
                          />
                        </div>
                      </summary>

                      <div
                        className="px-4 pb-4 pt-1 space-y-4"
                        style={{ borderTop: `1px solid ${color}14` }}
                      >
                        {paper.sections.map((section) => (
                          <div key={`${paper.title}-${section.heading}`}>
                            <div
                              className="text-[11px] tracking-[0.18em] uppercase font-semibold mb-2"
                              style={{ color: `${color}BE`, fontFamily: "var(--font-label)" }}
                            >
                              {section.heading}
                            </div>
                            <div className="space-y-2">
                              {section.paragraphs.map((paragraph, paragraphIndex) => (
                                <p
                                  key={`${paper.title}-${section.heading}-${paragraphIndex}`}
                                  className="text-sm leading-relaxed text-white/62"
                                >
                                  {paragraph}
                                </p>
                              ))}
                            </div>

                            {section.bullets && section.bullets.length > 0 && (
                              <ul className="mt-3 space-y-2">
                                {section.bullets.map((bullet, bulletIndex) => (
                                  <li
                                    key={`${paper.title}-${section.heading}-bullet-${bulletIndex}`}
                                    className="flex items-start gap-2 text-sm leading-relaxed text-white/60"
                                  >
                                    <ChevronRight
                                      size={14}
                                      className="mt-0.5 shrink-0"
                                      style={{ color: `${color}86` }}
                                    />
                                    <span>{bullet}</span>
                                  </li>
                                ))}
                              </ul>
                            )}

                            {section.image && (
                              <figure
                                className="mt-4 overflow-hidden rounded-xl"
                                style={{ border: `1px solid ${color}18`, background: `${color}06` }}
                              >
                                <img
                                  src={section.image.src}
                                  alt={section.image.alt}
                                  className="w-full h-auto object-cover"
                                  loading="lazy"
                                />
                                {section.image.caption && (
                                  <figcaption className="px-4 py-3 text-xs leading-relaxed text-white/46">
                                    {section.image.caption}
                                  </figcaption>
                                )}
                              </figure>
                            )}

                            {section.links && section.links.length > 0 && (
                              <div className="mt-4 flex flex-col gap-2">
                                {section.links.map((link) => (
                                  <a
                                    key={`${paper.title}-${section.heading}-${link.href}`}
                                    href={link.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 text-sm transition-opacity hover:opacity-100 opacity-85"
                                    style={{ color: `${color}D4` }}
                                  >
                                    <ExternalLink size={14} />
                                    <span>{link.label}</span>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
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

type SpotlightNoteBlock =
  | { type: "h1" | "h2" | "h3" | "p"; text: string }
  | { type: "ul" | "ol"; items: string[] }
  | { type: "math"; expression: string }
  | { type: "hr" };

const SPOTLIGHT_BULLET_RE = /^[-*]\s+(.+)/;
const SPOTLIGHT_ORDERED_RE = /^\d+\.\s+(.+)/;
const SPOTLIGHT_INLINE_MATH_RE = /\$([^$\n]+)\$/;

function extractSpotlightBlockMath(line: string): string | null {
  const trimmed = line.trim();
  const blockMathDouble = trimmed.match(/^\$\$(.+)\$\$$/);
  if (blockMathDouble) return blockMathDouble[1].trim();
  const blockMathSingle = trimmed.match(/^\$(.+)\$$/);
  if (blockMathSingle) return blockMathSingle[1].trim();
  return null;
}

function isSpotlightStructuralLine(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed === "---" ||
    /^#{1,3}\s+/.test(trimmed) ||
    SPOTLIGHT_BULLET_RE.test(trimmed) ||
    SPOTLIGHT_ORDERED_RE.test(trimmed) ||
    extractSpotlightBlockMath(trimmed) !== null
  );
}

function escapeSpotlightHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// 中文注释：公式渲染失败时优雅降级为原文，避免页面报错
function renderSpotlightKatex(expression: string, displayMode: boolean): string {
  try {
    return katex.renderToString(expression, {
      displayMode,
      throwOnError: false,
      strict: "ignore",
      trust: false,
    });
  } catch {
    return `<code>${escapeSpotlightHtml(expression)}</code>`;
  }
}

// 中文注释：把 Paper Spotlight 的 Markdown 风格长文转换成结构化块，视觉上对齐 Knowledge System 的阅读体验
function parseSpotlightNote(note: string): SpotlightNoteBlock[] {
  const lines = note.split(/\r?\n/);
  const blocks: SpotlightNoteBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const trimmed = lines[index].trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed === "---") {
      blocks.push({ type: "hr" });
      index += 1;
      continue;
    }

    const blockMathExpression = extractSpotlightBlockMath(trimmed);
    if (blockMathExpression) {
      blocks.push({ type: "math", expression: blockMathExpression });
      index += 1;
      continue;
    }

    if (trimmed.startsWith("### ")) {
      blocks.push({ type: "h3", text: trimmed.slice(4) });
      index += 1;
      continue;
    }

    if (trimmed.startsWith("## ")) {
      blocks.push({ type: "h2", text: trimmed.slice(3) });
      index += 1;
      continue;
    }

    if (trimmed.startsWith("# ")) {
      blocks.push({ type: "h1", text: trimmed.slice(2) });
      index += 1;
      continue;
    }

    if (SPOTLIGHT_BULLET_RE.test(trimmed)) {
      const items: string[] = [];
      let cursor = index;
      while (cursor < lines.length) {
        const current = lines[cursor].trim();
        if (!current) {
          const next = lines[cursor + 1]?.trim() ?? "";
          if (SPOTLIGHT_BULLET_RE.test(next)) {
            cursor += 1;
            continue;
          }
          break;
        }
        const match = current.match(SPOTLIGHT_BULLET_RE);
        if (!match) break;
        items.push(match[1]);
        cursor += 1;
      }
      blocks.push({ type: "ul", items });
      index = cursor;
      continue;
    }

    if (SPOTLIGHT_ORDERED_RE.test(trimmed)) {
      const items: string[] = [];
      let cursor = index;
      while (cursor < lines.length) {
        const current = lines[cursor].trim();
        if (!current) {
          const next = lines[cursor + 1]?.trim() ?? "";
          if (SPOTLIGHT_ORDERED_RE.test(next)) {
            cursor += 1;
            continue;
          }
          break;
        }
        const match = current.match(SPOTLIGHT_ORDERED_RE);
        if (!match) break;
        items.push(match[1]);
        cursor += 1;
      }
      blocks.push({ type: "ol", items });
      index = cursor;
      continue;
    }

    const paragraphLines = [trimmed];
    let cursor = index + 1;
    while (cursor < lines.length) {
      const current = lines[cursor].trim();
      if (!current || isSpotlightStructuralLine(current)) break;
      paragraphLines.push(current);
      cursor += 1;
    }
    blocks.push({ type: "p", text: paragraphLines.join(" ") });
    index = cursor;
  }

  return blocks;
}

function renderSpotlightInlineText(text: string): ReactNode[] {
  // 中文注释：支持同一段中的加粗与行内数学公式混排
  const parts = text.split(/(\*\*[^*]+\*\*|\$[^$\n]+\$)/g).filter(Boolean);
  return parts.map((part, idx) => {
    const strongMatch = part.match(/^\*\*(.+)\*\*$/);
    if (strongMatch) {
      return (
        <strong key={`spotlight-strong-${idx}`} className="font-semibold text-white/88">
          {strongMatch[1]}
        </strong>
      );
    }

    const mathMatch = part.match(SPOTLIGHT_INLINE_MATH_RE);
    if (mathMatch) {
      return (
        <span
          key={`spotlight-math-${idx}`}
          className="inline-block align-middle text-white/84"
          dangerouslySetInnerHTML={{
            __html: renderSpotlightKatex(mathMatch[1], false),
          }}
        />
      );
    }

    return <span key={`spotlight-text-${idx}`}>{part}</span>;
  });
}

function SpotlightNoteDocument({ note, color }: { note: string; color: string }) {
  const blocks = parseSpotlightNote(note);

  return (
    <div className="rounded-xl p-4 md:p-5" style={{ background: `${color}0C` }}>
      <div className="space-y-3.5">
        {blocks.map((block, blockIndex) => {
          if (block.type === "h1") {
            return (
              <h4
                key={`spotlight-h1-${blockIndex}`}
                className="text-lg md:text-xl font-semibold text-white/92 leading-relaxed"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {renderSpotlightInlineText(block.text)}
              </h4>
            );
          }

          if (block.type === "h2") {
            return (
              <div
                key={`spotlight-h2-${blockIndex}`}
                className="text-[11px] tracking-[0.18em] uppercase font-semibold pt-1"
                style={{ color: `${color}C6`, fontFamily: "var(--font-label)" }}
              >
                {renderSpotlightInlineText(block.text)}
              </div>
            );
          }

          if (block.type === "h3") {
            return (
              <div key={`spotlight-h3-${blockIndex}`} className="text-sm font-semibold text-white/84">
                {renderSpotlightInlineText(block.text)}
              </div>
            );
          }

          if (block.type === "ul") {
            return (
              <ul key={`spotlight-ul-${blockIndex}`} className="space-y-2">
                {block.items.map((item, itemIndex) => (
                  <li key={`spotlight-ul-item-${blockIndex}-${itemIndex}`} className="flex items-start gap-2 text-sm leading-relaxed text-white/66">
                    <ChevronRight size={14} className="mt-0.5 shrink-0" style={{ color: `${color}86` }} />
                    <span>{renderSpotlightInlineText(item)}</span>
                  </li>
                ))}
              </ul>
            );
          }

          if (block.type === "ol") {
            return (
              <ol key={`spotlight-ol-${blockIndex}`} className="space-y-2">
                {block.items.map((item, itemIndex) => (
                  <li key={`spotlight-ol-item-${blockIndex}-${itemIndex}`} className="flex items-start gap-2 text-sm leading-relaxed text-white/66">
                    <span
                      className="mt-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold"
                      style={{ color: `${color}E8`, background: `${color}1C` }}
                    >
                      {itemIndex + 1}
                    </span>
                    <span>{renderSpotlightInlineText(item)}</span>
                  </li>
                ))}
              </ol>
            );
          }

          if (block.type === "hr") {
            return (
              <div
                key={`spotlight-hr-${blockIndex}`}
                className="h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${color}32, transparent)` }}
              />
            );
          }

          if (block.type === "math") {
            return (
              <div key={`spotlight-math-block-${blockIndex}`} className="overflow-x-auto rounded-lg px-2 py-2" style={{ background: `${color}08` }}>
                <div
                  className="min-w-fit text-white/84"
                  dangerouslySetInnerHTML={{
                    __html: renderSpotlightKatex(block.expression, true),
                  }}
                />
              </div>
            );
          }

          if (block.type === "p") {
            return (
              <p key={`spotlight-p-${blockIndex}`} className="text-sm leading-relaxed text-white/68">
                {renderSpotlightInlineText(block.text)}
              </p>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Paper Spotlight（算法页轻量论文卡）
   ═══════════════════════════════════════════════════════════════ */
function PaperSpotlightCards({ items, color }: { items: PaperSpotlightItem[]; color: string }) {
  // 中文注释：仅展开一张卡片，避免页面过于复杂
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (items.length === 0) return null;

  return (
    // 中文注释：展开任意一张卡片时，切换为单列，让内容占满该页面可用最大宽度
    <div className={`grid grid-cols-1 ${expandedIndex === null ? "lg:grid-cols-2" : "lg:grid-cols-1"} gap-4`}>
      {items.map((item, index) => {
        const isExpanded = expandedIndex === index;
        return (
          <motion.article
            key={`${item.title}-${item.noteDate}-${index}`}
            custom={index}
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            whileHover={{ y: -4, scale: 1.01 }}
            // 中文注释：文案区域上下留白减半（仅收缩 y 轴 padding，左右保持不变）
            className={`rounded-2xl px-5 py-2.5 md:px-6 md:py-3 relative overflow-hidden ${
              isExpanded ? "w-full" : ""
            }`}
            style={{
              // 中文注释：主底色改为“左亮右近纯黑”的定向渐变
              background: `linear-gradient(90deg, ${color}34 0%, ${color}1c 26%, rgba(10,10,14,0.94) 62%, rgba(0,0,0,0.98) 100%)`,
            }}
          >
            {/* 中文注释：Paper Spotlight 卡片背景改为动态渐变光效 */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                // 中文注释：动态光效仅保留在左侧区域，避免污染右侧黑色
                background: `radial-gradient(circle at 12% 52%, ${color}3a 0%, ${color}1e 24%, transparent 62%)`,
              }}
              animate={{ opacity: [0.42, 0.58, 0.42], scale: [1, 1.03, 1] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(90deg, ${color}1e 0%, transparent 34%, rgba(0,0,0,0.14) 100%)`,
              }}
              animate={{ opacity: [0.3, 0.18, 0.3] }}
              transition={{ duration: 6.2, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="relative z-10">
              {/* 中文注释：把论文标题和 👀 UI 按钮并排到同一行，并整体缩小尺寸以节省空间 */}
              <div className="flex items-center justify-start gap-1 flex-nowrap">
                <h3
                  className="min-w-0 max-w-[82%] text-sm md:text-base font-semibold text-white/92 leading-relaxed whitespace-nowrap overflow-hidden text-ellipsis"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {item.title}
                </h3>

                <button
                  type="button"
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  // 中文注释：仅按钮增加右下->左上渐变背景，图案保持原有 👀/🙈 不变
                  className="inline-flex items-center justify-center rounded-full h-11 w-11 text-base transition-all duration-200 hover:scale-110 shrink-0 -ml-1"
                  style={{
                    color: `${color}EA`,
                    background: `linear-gradient(to top left, ${color}2E 0%, rgba(0,0,0,0.72) 100%)`,
                  }}
                  aria-label={isExpanded ? "收起笔记" : "查看笔记"}
                  title={isExpanded ? "收起笔记" : "查看笔记"}
                >
                  <span aria-hidden="true">{isExpanded ? "🙈" : "👀"}</span>
                </button>
              </div>

              <div
                // 中文注释：缩小标题文案与 Notes Time 文案之间的间距
                className="mt-0.5 min-w-0 text-[10px] md:text-[11px] tracking-[0.12em] uppercase text-white/48 whitespace-nowrap overflow-hidden text-ellipsis"
                style={{ fontFamily: "var(--font-label)" }}
              >
                Notes Time · {item.noteDate}
              </div>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    key="paper-note"
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <SpotlightNoteDocument note={item.note} color={color} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.article>
        );
      })}
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
  // 中文注释：按需求隐藏非视觉分支的大标题（产品/算法/系统/学术跨界/无限可能）
  const shouldHideBranchTitle = !isVisualFace;
  // 中文注释：算法分支单独放大 ALGORITHM 标识，并压缩其上下间距
  const isAlgorithmFace = face.id === 3;
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
                <div className={isAlgorithmFace ? "pt-0" : "pt-4 lg:pt-8"}>
                  {/* Hero 区域 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    // 中文注释：按需求将 ALGORITHM 与 PAPER SPOTLIGHT 之间间距设置为 20px
                    className={isAlgorithmFace ? "mb-[20px]" : "mb-12 lg:mb-16"}
                  >
                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
                      {/* 左侧：标题区 */}
                      <div className={isAlgorithmFace ? "space-y-[0.1rem]" : "space-y-6"}>
                        {/* 副标题 */}
                        <div
                          className={
                            isAlgorithmFace
                              // 中文注释：移除负上边距，避免进入顶部 blur 区导致文字发糊
                              ? "text-2xl tracking-[0.18em] uppercase font-semibold"
                              : "text-xs tracking-[0.4em] uppercase font-semibold"
                          }
                          style={{ fontFamily: "var(--font-label)", color: `${face.color}cc` }}
                        >
                          {face.subtitle}
                        </div>

                        {/* 标题（非视觉分支按需求隐藏） */}
                        {!shouldHideBranchTitle && (
                          <h1
                            className="text-5xl sm:text-6xl md:text-7xl font-black text-white leading-[0.95] tracking-tight"
                            style={{ 
                              fontFamily: "var(--font-display)",
                              textShadow: `0 0 60px ${face.color}30`,
                            }}
                          >
                            {face.title}
                          </h1>
                        )}

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

                  {/* 中文注释：算法分支按需求移除 ALGORITHM 与 Paper Spotlight 之间的分隔留白 */}
                  {!isAlgorithmFace && (
                    <div className="h-[1px] mb-12 lg:mb-16" style={{ background: `linear-gradient(90deg, transparent, ${face.color}30, transparent)` }} />
                  )}

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

                  {/* ─── 算法分支：知识体系 + 核心课程 + 技术应用 + 实战项目 ─── */}
                  {face.id === 3 && (
                    <>
                      {/* 中文注释：Paper Spotlight 放在 Knowledge System 区块上方 */}
                      <div className="mb-12 lg:mb-16">
                        <SectionTitle title="PAPER SPOTLIGHT" color={face.color} />
                        <PaperSpotlightCards items={ALGORITHM_PAPER_SPOTLIGHT_ITEMS} color={face.color} />
                      </div>

                      {face.knowledgeChain && (
                        <div className="mb-12 lg:mb-16">
                          <SectionTitle title="KNOWLEDGE SYSTEM" color={face.color} />
                          {/* 中文注释：知识系统改为左右分栏，因此放宽容器宽度 */}
                          <div className="max-w-6xl mx-auto">
                            <KnowledgeChain chain={face.knowledgeChain} color={face.color} />
                          </div>
                        </div>
                      )}

                      {face.algorithmCourseDetails && face.algorithmCourseDetails.length > 0 && (
                        <div className="mb-12 lg:mb-16">
                          <SectionTitle title="CORE COURSES & PRACTICE" color={face.color} />
                          <AlgorithmCourseDetails courses={face.algorithmCourseDetails} color={face.color} />
                        </div>
                      )}

                      {face.algorithmApplicationAreas && face.algorithmApplicationAreas.length > 0 && (
                        <div className="mb-12 lg:mb-16">
                          <SectionTitle title="TECHNICAL APPLICATIONS" color={face.color} />
                          <AlgorithmApplicationAreas areas={face.algorithmApplicationAreas} color={face.color} />
                        </div>
                      )}

                      {face.algorithmProjects && face.algorithmProjects.length > 0 && (
                        <div className="mb-12 lg:mb-16">
                          <SectionTitle title="PRACTICAL PROJECTS" color={face.color} />
                          <AlgorithmProjects projects={face.algorithmProjects} color={face.color} />
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

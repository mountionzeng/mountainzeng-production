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
import type { AlgorithmProject, DiceFace, WorkItem } from "@/lib/diceData";
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
const BRANCH_CONTENT_MAX_WIDTH_PX = 1360;

type PaperSpotlightItem = {
  title: string;
  noteDate: string;
  note: string;
};

// 中文注释：算法分支的 Paper Spotlight 卡片默认数据（后续可直接替换）
const ALGORITHM_PAPER_SPOTLIGHT_ITEMS: PaperSpotlightItem[] = [
  {
    // 中文注释：按今日内容更新 Attention Residuals 笔记
    title: "《Attention Residuals》 的笔记",
    noteDate: "2026-03-20",
    note: "# 《Attention Residuals》 的笔记\n\n\n## 前置\n\n需要对以下几个概念有理解\n\n### 1. Transformer 架构与残差连接\n\nTransformer 是现代大语言模型的基础架构。在 Transformer 中，每一层都包含两个主要组件：自注意力机制（Self-Attention）和前馈神经网络（FFN）。而**残差连接**（Residual Connection）是让这个深层网络能够成功训练的关键技术。\n\n残差连接的基本思想非常简单：不是让网络直接学习从输入到输出的映射，而是学习一个“残差”——也就是输出与输入之间的差异。数学上表示为：\n\n$\\text{output} = \\text{input} + \\text{Layer}(\\text{input})$\n\n这个简单的设计解决了深度神经网络训练中的梯度消失问题，让我们能够堆叠几十甚至上百层网络。\n\n### 2. PreNorm vs PostNorm\n\n在 Transformer 中，Layer Normalization（层归一化）的位置有两种主流方案：\n\n- **PostNorm**（原始 Transformer 设计）：先做子层计算，再做归一化，最后加残差\n\n  - 公式：$x_{l+1} = \\text{LN}(x_l + \\text{Layer}(x_l))$\n\n  - 归一化在“外面”，可以控制最终输出的幅度\n\n  - 问题：深层网络梯度容易消失，训练不稳定\n\n- **PreNorm**（现代 LLM 标配）：先归一化，再做子层计算，最后加残差\n\n  - 公式：$x_{l+1} = x_l + \\text{Layer}(\\text{LN}(x_l))$\n\n  - 归一化在“里面”，只约束输入到子层的数据\n\n  - 优势：训练更稳定，梯度流动更顺畅\n\n  - 问题：这正是 Attention Residuals 要解决的\n\n  - 虽然 `LN(x)` 被归一化了，但残差连接 `x + Layer(LN(x))` 的输出**没有被归一化**\n\n  - 随着层数增加，`x` 不断累加，幅度越来越大（这就是“稀释问题”的来源）\n\n### 3. 重点 shuo yi xiaPreNorm 的“稀释问题”\n\nPreNorm 虽然让训练变得稳定，但引入了一个微妙而严重的问题：**层贡献的逐层稀释**。\n\n想象一下，你有一个 100 层的网络。在 PreNorm 架构下，每一层的输出都以**固定权重 1** 累加到下一层：\n\n$x_L = x_0 + \\sum_{l=1}^{L} \\text{Layer}_l(\\text{LN}(x_l))$\n\n这意味着什么？随着网络加深：\n\n- 隐藏状态的幅度不断增长（从 $x_0$ 一直加到 $x_L$）\n\n- 每一层的贡献被“平均”稀释——第 1 层的输出要和后面 99 层的输出“平分秋色”\n\n- 越深的层，想要对最终输出产生显著影响就越困难\n\n这就像一个会议，前面的发言者说了一句话，后面 99 个人每人也说一句话，最后所有话等权重混在一起——前面的声音自然就被淹没了。\n\n### 4. 注意力机制的本质\n\n注意力机制（Attention）的核心思想是：**不是所有信息都同等重要，模型应该学会动态地“关注”最相关的部分**。\n\n在 Transformer 的序列维度上，注意力机制通过 Query-Key-Value 机制，让模型能够：\n\n- 根据当前 token（Query）\n\n- 在所有历史 token（Key）中检索\n\n- 用学习到的权重（通过 softmax 归一化）聚合信息（Value）\n\n这个机制的威力在于：权重是**输入相关的**（input-dependent）和**可学习的**（learned），而不是固定的。\n\n---\n\n## Attention Residuals：核心创新\n\n### 问题的本质\n\n传统残差连接的问题在于：\n\n- 所有层的输出以**固定权重 1** 累加\n\n- 无论输入是什么，累加方式都是机械的、均匀的\n\n- 模型无法根据当前任务动态调整“应该更多地依赖哪一层的信息”\n\n这就像你在写一篇文章时，必须把所有草稿的每一版都等权重地混合在一起——显然不合理。有时候你需要第 3 版的开头，有时候需要第 7 版的结论，而不是把所有版本平均混合。\n\n### Attention Residuals 的解决方案\n\nKimi 团队提出的方案极其优雅：**用 softmax 注意力替代固定累加**。\n\n**Full Attention Residuals** 的公式是：\n\n$x_{l+1} = \\sum_{i=0}^{l} \\alpha_{l,i} \\cdot x_i$\n\n其中权重 $\\alpha_{l,i}$ 通过注意力机制计算：\n\n$\\alpha_{l,i} = \\frac{\\exp(q_l^T k_i)}{\\sum_{j=0}^{l} \\exp(q_l^T k_j)}$\n\n这里：\n\n- $q_l$ 是当前层的 query（从当前隐藏状态生成）\n\n- $k_i$ 是第 $i$ 层的 key（从该层的输出生成）\n\n- 权重通过 softmax 归一化，确保和为 1\n\n#### 这个公式在做什么？\n\n**第一步：生成 Query 和 Key**\n\n对于第 $l$ 层，我们需要：\n\n- 从当前层的隐藏状态生成一个 **query 向量** $q_l$\n\n- 从之前每一层（第 0 到第 $l$ 层）的输出生成对应的 **key 向量** $k_0, k_1, ..., k_l$\n\n这个过程通常通过简单的线性变换实现：\n\n- $q_l = W_q \\cdot h_l$（$h_l$ 是当前层的某个表征）\n\n- $k_i = W_k \\cdot x_i$（$x_i$ 是第 $i$ 层的输出）\n\n**第二步：计算注意力分数**\n\n对于每一个前面的层 $i$，计算当前层的 query 与该层 key 的**相似度**：\\\n$\\text{score}_{l,i} = q_l^T k_i$\n\n这个点积操作衡量的是：“当前层需要的信息”与“第 $i$ 层提供的信息“之间的匹配程度。\n\n- 如果 $q_l$ 和 $k_i$ 方向相似，点积值大 → 说明第 $i$ 层的信息对当前层很重要\n\n- 如果方向差异大，点积值小 → 说明第 $i$ 层的信息不太相关\n\n**第三步：Softmax 归一化**\n\n将所有的相似度分数通过 softmax 转换为权重：\\\n$\\alpha_{l,i} = \\frac{\\exp(q_l^T k_i)}{\\sum_{j=0}^{l} \\exp(q_l^T k_j)}$\n\nSoftmax 的作用是：\n\n1. **归一化**：确保所有权重加起来等于 1（$\\sum_{i=0}^{l} \\alpha_{l,i} = 1$）\n\n2. **放大差异**：通过指数函数，让相似度高的层权重更高，相似度低的层权重更低\n\n3. **可微分**：整个过程可微，可以通过反向传播训练\n\n**第四步：加权聚合**\n\n最后，用这些权重对所有前面层的输出进行加权求和：\\\n$x_{l+1} = \\sum_{i=0}^{l} \\alpha_{l,i} \\cdot x_i$\n\n这就是新的“残差连接”——不再是简单的 $x_l + \\text{Layer}(x_l)$，而是智能地从所有历史层中选择性地聚合信息。\n\n#### 与传统残差连接的对比\n\n让我们用一个具体的例子来对比：\n\n**传统 PreNorm 残差连接**（假设有 3 层）：\n\n```plaintext\nx_0 = 输入\nx_1 = x_0 + Layer_1(LN(x_0))\nx_2 = x_1 + Layer_2(LN(x_1)) = x_0 + Layer_1(...) + Layer_2(...)\nx_3 = x_2 + Layer_3(LN(x_2)) = x_0 + Layer_1(...) + Layer_2(...) + Layer_3(...)\n```\n\n每一层的贡献都是**固定权重 1**，机械累加。\n\n**Attention Residuals**（同样 3 层）：\n\n```plaintext\nx_0 = 输入\nx_1 = α_{1,0}·x_0 + α_{1,1}·(x_0 + Layer_1(...))\nx_2 = α_{2,0}·x_0 + α_{2,1}·x_1 + α_{2,2}·(x_1 + Layer_2(...))\nx_3 = α_{3,0}·x_0 + α_{3,1}·x_1 + α_{3,2}·x_2 + α_{3,3}·(x_2 + Layer_3(...))\n```\n\n每一层的贡献权重 $\\alpha$ 是**动态学习的**，根据输入而变化。\n\n#### 一个具体的场景\n\n假设你在处理一个翻译任务，输入是 “The cat sat on the mat”：\n\n**第 10 层**可能学到：\n\n- 需要关注**第 2 层**（词法信息）：权重 $\\alpha_{10,2} = 0.6$\n\n- 需要关注**第 5 层**（句法结构）：权重 $\\alpha_{10,5} = 0.3$\n\n- 其他层权重较低：$\\alpha_{10,0} = 0.05, \\alpha_{10,1} = 0.02, ...$\n\n**第 50 层**可能学到：\n\n- 需要关注**第 30 层**（语义理解）：权重 $\\alpha_{50,30} = 0.5$\n\n- 需要关注**第 45 层**（上下文整合）：权重 $\\alpha_{50,45} = 0.4$\n\n- 早期层权重很低：$\\alpha_{50,0} \\approx 0, \\alpha_{50,2} \\approx 0$\n\n这种动态选择让模型能够：\n\n- **跳过不相关的层**：如果某些中间层对当前任务没用，权重可以接近 0\n\n- **强化关键层**：把注意力集中在真正重要的几层上\n\n- **适应不同输入**：同一层在处理不同句子时，可能依赖不同的历史层\n\n#### 为什么这比固定权重好？\n\n传统残差连接的问题：\n\n1. **无差别累加**：第 1 层和第 99 层的贡献被平等对待，即使第 1 层可能已经不相关\n\n2. **幅度失控**：$x_{100} = x_0 + \\sum_{i=1}^{100} \\text{Layer}_i(...)$，幅度越来越大\n\n3. **稀释效应**：每一层的贡献被“平均”到所有层中，单层影响力下降\n\nAttention Residuals 的优势：\n\n1. **选择性聚合**：模型自己决定哪些层重要，权重可以差异巨大\n\n2. **幅度可控**：因为 $\\sum \\alpha_{l,i} = 1$，输出幅度不会无限增长\n\n3. **信息保留**：重要层的贡献不会被稀释，权重可以集中在少数关键层上\n\n**这意味着什么？** 每一层现在可以：\n\n1. **动态选择**：根据当前输入，决定应该更多地依赖哪些前面的层\n\n2. **学习权重**：这些选择不是人为设定的，而是在训练中学习出来的\n\n3. **输入相关**：不同的输入会导致不同的层选择策略\n\n### 一个直观的类比\n\n想象你在解一道数学题：\n\n- **传统残差连接**：你必须把草稿纸上的每一步计算都等权重地“平均”起来作为答案\n\n- **Attention Residuals**：你可以智能地选择——“这道题的关键在第 3 步和第 7 步，我主要用这两步的结果，其他步骤权重降低”\n\n这就是从“机械累加”到“智能检索”的范式转变。\n\n---\n\n## 工程化挑战与 Block AttnRes\n\n理论上，Full Attention Residuals 很完美。但在实际的大规模模型训练中，它面临一个致命问题：**内存和通信开销**。\n\n### 问题分析\n\n假设你有一个 100 层的网络，每层的隐藏状态维度是 $d$：\n\n- Full AttnRes 需要在每一层存储**所有前面层的输出**\n\n- 内存复杂度：$O(L \\times d)$，其中 $L$ 是层数\n\n- 对于 48B 参数的模型，这个开销是不可接受的\n\n在分布式训练（尤其是流水线并行）中，这还会导致大量的跨设备通信开销。\n\n### Block Attention Residuals：务实的折中\n\nKimi 团队提出了 **Block AttnRes**，这是一个工程化的解决方案：\n\n1. **分块策略**：将 $L$ 层网络划分为 $N$ 个块（Block）\n\n2. **块内标准残差**：在每个块内部，仍然使用传统的固定权重残差连接\n\n3. **块间注意力**：只在块的边界上，对这 $N$ 个块级表征执行注意力聚合\n\n这样：\n\n- 内存复杂度从 $O(L \\times d)$ 降低到 $O(N \\times d)$\n\n- 如果 $N = 10$，$L = 100$，内存开销直接降低 10 倍\n\n- 同时保留了大部分 Full AttnRes 的性能增益\n\n### 关键的工程优化\n\n论文还提出了两个重要的系统优化：\n\n1. **缓存式流水线通信**：在流水线并行中，通过缓存机制减少跨设备的块级表征传输\n\n2. **两阶段计算策略**：将注意力计算和残差聚合分离，优化计算效率\n\n这些优化让 Block AttnRes 成为一个**可以直接替换标准残差连接的即插即用方案**，训练开销几乎可以忽略不计。\n\n---\n\n## 实验验证：真的有用吗？\n\nKimi 团队在真实的大规模预训练中验证了这个方案，这是最有说服力的部分。\n\n### 训练配置\n\n- **模型**：Kimi Linear 48B（总参数 48B，激活参数 3B 的 MoE 架构）\n\n- **数据**：1.4 万亿 tokens 的预训练语料\n\n- **对比**：标准残差连接 vs Block AttnRes\n\n### 核心结果\n\n1. **训练效率提升 25%**：在相同的计算预算下，AttnRes 模型的性能显著更好\n\n2. **推理延迟仅增 2%**：几乎没有额外的推理开销\n\n3. **Scaling Law 一致性**：在不同模型规模下，改进都是一致的\n\n### 深层次的改进\n\n更重要的是，AttnRes 从根本上改善了网络的内部动力学：\n\n- **隐藏状态幅度更均匀**：不再出现 PreNorm 的无控制增长\n\n- **梯度分布更平衡**：各层的梯度不再随深度剧烈衰减\n\n- **层贡献更合理**：每一层都能对最终输出产生有意义的影响\n\n这些改进不仅体现在最终的性能指标上，更体现在模型的**可训练性**和**可扩展性**上。\n\n---\n\n## Why is this job so important\n\n### 1. 理论上的优雅统一\n\nAttention Residuals 提供了一个**统一的视角**：\n\n- Transformer 用注意力替代了 RNN 的序列递归（横向维度）\n\n- AttnRes 用注意力替代了残差的固定累加（纵向维度）\n\n这是一个完整的、对称的设计哲学。\n\n### 2. 工程上的可落地性\n\n与许多“纸面上很美”的研究不同，AttnRes：\n\n- 真正在 48B 规模的模型上验证了\n\n- 解决了内存、通信、计算的所有工程问题\n\n- 提供了即插即用的实现方案\n\n### 3. 对未来的启示\n\n这个工作打开了一个新的研究方向：**深度维度的动态架构**。\n\n未来可能的探索包括：\n\n- 更复杂的深度注意力模式（不只是简单的 QKV）\n\n- 自适应的块划分策略（根据任务动态调整块大小）\n\n- 与其他架构创新（如 MoE、长上下文）的结合\n\n---\n\n## 总结：\n\n《Attention Residuals》的核心贡献可以用一句话概括：\n\n**把 Transformer 在序列维度上“用注意力替代递归”的成功经验，迁移到了深度维度上，用可学习的、输入相关的注意力聚合，替代了固定权重的残差累加。**\n\n这是对 Transformer 架构底层设计的重新思考。它解决了 PreNorm 架构中长期存在但被忽视的“层贡献稀释”问题，并且通过精巧的工程设计（Block AttnRes），让这个理论上优雅的方案在实际的大规模训练中真正可行。\n\n这篇论文的价值在于：它提醒我们，即使是看似“已经定型”的架构组件（如残差连接），仍然有重新审视和改进的空间。而对于工程实践者来说，Block AttnRes 提供了一个可以立即尝试的、经过验证的方案，来提升模型的训练效率和最终性能。\n",
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
function ProgrammingLanguageCapability({
  color,
  capability,
}: {
  color: string;
  capability: NonNullable<DiceFace["systemLanguageCapability"]>;
}) {
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
          <div className="text-sm font-semibold text-white/88 mb-3">{capability.lowerLayerTitle}</div>
          <div className="text-sm text-white/75">{capability.lowerLanguages}</div>
          <div className="text-sm text-white/45 my-1.5">{capability.lowerAction}</div>
          <div className="text-sm text-white/65 leading-relaxed">{capability.lowerTargets}</div>
          <div className="text-sm text-white/45 mt-2">{capability.lowerInfrastructure}</div>
        </div>

        <div
          className="rounded-xl p-4"
          style={{ border: `1px solid ${color}20`, background: `${color}0A` }}
        >
          <div className="text-sm font-semibold text-white/88 mb-3">{capability.upperLayerTitle}</div>
          <div className="text-sm text-white/75">{capability.upperLanguages}</div>
          <div className="text-sm text-white/45 my-1.5">{capability.upperAction}</div>
          <div className="text-sm text-white/65 leading-relaxed">{capability.upperTargets}</div>
        </div>
      </div>

      <div className="space-y-3 text-sm leading-relaxed">
        <p className="text-white/72">
          <span style={{ color: `${color}D8` }}>核心语言：</span>
          {capability.coreLanguages}
        </p>
        <p className="text-white/62">
          <span style={{ color: `${color}D8` }}>补足方式：</span>
          {capability.supplementMethod}
        </p>
      </div>
    </div>
  );
}

/* ─── 个人系统能力体系树（系统页专用）─── */
type SystemAbilityLayer = {
  layerTitle: string;
  entries: SystemAbilityEntry[];
  notes: string[];
};

type SystemAbilityEntry = {
  title: string;
  bullets: string[];
  summary?: string;
};

const PRIMARY_LAYER_RE = /^【第.+层[:：].+】/;

// 中文注释：解析系统能力树文本，支持层级标题、课程条目、项目符号细项与总结语
function parseSystemAbilityTree(treeText: string): { title: string; layers: SystemAbilityLayer[] } {
  const normalize = (line: string) => line.replace(/^[\s│├└─]+/, "").trim();
  const lines = treeText
    .split("\n")
    .map((line) => line.replace(/\r/g, ""))
    .filter((line) => line.trim().length > 0);

  const title = normalize(lines[0] ?? "个人的系统能力体系");
  const layers: SystemAbilityLayer[] = [];
  let currentLayer: SystemAbilityLayer | null = null;
  let currentEntry: SystemAbilityEntry | null = null;

  const pushCurrentEntry = () => {
    if (!currentLayer || !currentEntry) return;
    const hasContent =
      currentEntry.title.trim().length > 0 ||
      currentEntry.bullets.length > 0 ||
      Boolean(currentEntry.summary);
    if (hasContent) {
      currentLayer.entries.push(currentEntry);
    }
    currentEntry = null;
  };

  for (const rawLine of lines.slice(1)) {
    const line = normalize(rawLine);
    if (!line) continue;

    if (PRIMARY_LAYER_RE.test(line)) {
      pushCurrentEntry();
      const layerMatch = line.match(/^【([^】]+)】(.*)$/);
      const layerTitleBase = layerMatch?.[1]?.trim() ?? line;
      const layerTitleSuffix = layerMatch?.[2]?.trim() ?? "";
      const layerTitle = `${layerTitleBase}${layerTitleSuffix ? ` ${layerTitleSuffix}` : ""}`.trim();
      currentLayer = {
        layerTitle,
        entries: [],
        notes: [],
      };
      layers.push(currentLayer);
      continue;
    }

    if (!currentLayer) continue;

    const inlineSectionMatch = line.match(/^【(.+?)】$/);
    if (inlineSectionMatch) {
      pushCurrentEntry();
      currentEntry = {
        title: inlineSectionMatch[1],
        bullets: [],
      };
      continue;
    }

    if (/^CS\d+/i.test(line)) {
      pushCurrentEntry();
      currentEntry = {
        title: line,
        bullets: [],
      };
      continue;
    }

    if (/^[•·*-]\s*/.test(line)) {
      if (!currentEntry) {
        currentEntry = { title: "补充说明", bullets: [] };
      }
      const bullet = line.replace(/^[•·*-]\s*/, "").trim();
      if (bullet) currentEntry.bullets.push(bullet);
      continue;
    }

    if (line.startsWith("↓")) {
      const summary = line.replace(/^↓\s*/, "").trim();
      if (currentEntry) {
        currentEntry.summary = summary;
      } else if (summary) {
        currentLayer.notes.push(summary);
      }
      continue;
    }

    if (currentEntry) {
      currentEntry.bullets.push(line);
    } else {
      currentLayer.notes.push(line);
    }
  }

  pushCurrentEntry();
  return { title, layers };
}

function getSystemLayerButtonLabel(layerTitle: string): string {
  const withoutPrefix = layerTitle.replace(/^第[^：:]+[：:]\s*/, "").trim();
  const withoutSuffix = withoutPrefix.replace(/（.*?）/g, "").trim();
  return `[${withoutSuffix || layerTitle}]`;
}

function SystemAbilityTree({ treeText, color }: { treeText: string; color: string }) {
  const { title, layers } = parseSystemAbilityTree(treeText);
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);
  const layerRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (layers.length === 0) {
      setActiveLayerIndex(0);
      return;
    }
    setActiveLayerIndex((prev) => Math.min(prev, layers.length - 1));
  }, [layers.length]);

  if (layers.length === 0) {
    return (
      <div
        className="rounded-2xl p-6 md:p-8"
        style={{
          background: `linear-gradient(145deg, ${color}12, ${color}06)`,
          border: `1px solid ${color}28`,
        }}
      >
        <pre
          className="whitespace-pre-wrap break-words text-sm md:text-[15px] leading-relaxed text-white/78"
          style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace" }}
        >
          {treeText}
        </pre>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 md:p-8"
      style={{
        background: `linear-gradient(145deg, ${color}1A, ${color}08 52%, rgba(0,0,0,0.45) 100%)`,
        border: `1px solid ${color}2F`,
      }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(circle at 18% 12%, ${color}2C 0%, transparent 52%), radial-gradient(circle at 84% 86%, ${color}1B 0%, transparent 50%)`,
        }}
      />

      <div className="relative">
        <div className="flex items-center justify-between gap-3 mb-5 md:mb-6">
          <div>
            <div
              className="text-[11px] tracking-[0.18em] uppercase font-semibold mb-1"
              style={{ color: `${color}C9`, fontFamily: "var(--font-label)" }}
            >
              system map
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-white/92" style={{ fontFamily: "var(--font-display)" }}>
              {title}
            </h3>
            <div className="text-[11px] md:text-xs mt-1 tracking-[0.08em] text-white/55" style={{ fontFamily: "var(--font-label)" }}>
              COMPUTER SCIENCE CURRICULUM HIERARCHY
            </div>
          </div>
          <div
            className="px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-[0.08em]"
            style={{
              color: `${color}EA`,
              background: `${color}1F`,
              border: `1px solid ${color}45`,
              fontFamily: "var(--font-label)",
            }}
          >
            {layers.length} 层结构
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
          <div className="lg:col-span-3">
            <div
              className="rounded-xl p-3 md:p-3.5"
              style={{
                border: `1px solid ${color}2A`,
                background: `linear-gradient(145deg, ${color}14, rgba(0,0,0,0.34))`,
              }}
            >
              <div
                className="text-[10px] tracking-[0.16em] uppercase font-semibold mb-2.5"
                style={{ color: `${color}BC`, fontFamily: "var(--font-label)" }}
              >
                layer buttons
              </div>

              <div className="relative space-y-2.5">
                <div
                  className="absolute left-[13px] top-3 bottom-3 w-px"
                  style={{ background: `linear-gradient(180deg, ${color}86 0%, ${color}24 100%)` }}
                />
                {layers.map((layer, index) => {
                  const isActive = index === activeLayerIndex;
                  return (
                    <button
                      key={`${layer.layerTitle}-btn-${index}`}
                      type="button"
                      onClick={() => {
                        setActiveLayerIndex(index);
                        layerRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                      }}
                      className="relative w-full text-left rounded-lg px-3 py-2.5 transition-all duration-200"
                      style={{
                        color: isActive ? `${color}F2` : "rgba(255,255,255,0.82)",
                        background: isActive ? `${color}2B` : "rgba(0,0,0,0.22)",
                        border: `1px solid ${isActive ? `${color}6A` : `${color}2D`}`,
                        boxShadow: isActive ? `0 0 16px ${color}35` : "none",
                      }}
                    >
                      <span
                        className="absolute left-[10px] top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full"
                        style={{ background: isActive ? `${color}F0` : `${color}86` }}
                      />
                      <span className="ml-4 text-sm md:text-[0.96rem] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                        {getSystemLayerButtonLabel(layer.layerTitle)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-9 space-y-3.5">
            {layers.map((layer, index) => {
              const isActive = index === activeLayerIndex;
              return (
                <motion.div
                  key={`${layer.layerTitle}-${index}`}
                  ref={(node) => {
                    layerRefs.current[index] = node;
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.36, delay: index * 0.06, ease: "easeOut" }}
                  className="relative pl-10"
                >
                  <div
                    className="absolute left-0 top-2.5 w-[30px] h-[30px] rounded-full flex items-center justify-center text-xs font-semibold"
                    style={{
                      color: `${color}F3`,
                      background: `linear-gradient(145deg, ${isActive ? `${color}56` : `${color}3A`}, ${color}1F)`,
                      border: `1px solid ${isActive ? `${color}7B` : `${color}52`}`,
                      boxShadow: isActive ? `0 0 16px ${color}45` : `0 0 10px ${color}2A`,
                      fontFamily: "var(--font-label)",
                    }}
                  >
                    {index + 1}
                  </div>

                  <div
                    className="rounded-xl p-4 md:p-5 transition-all duration-200"
                    style={{
                      background: `linear-gradient(145deg, rgba(255,255,255,0.035), ${color}10)`,
                      border: `1px solid ${isActive ? `${color}52` : `${color}2C`}`,
                      boxShadow: isActive ? `0 0 22px ${color}22` : "none",
                    }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                      <h4 className="text-base md:text-[1.05rem] font-semibold text-white/90" style={{ fontFamily: "var(--font-display)" }}>
                        {layer.layerTitle}
                      </h4>
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] text-white/85"
                        style={{
                          border: `1px solid ${color}35`,
                          background: `${color}1C`,
                          fontFamily: "var(--font-label)",
                        }}
                      >
                        {layer.entries.length} 个知识点
                      </span>
                    </div>

                    {layer.entries.length > 0 && (
                      <div className="space-y-3">
                        {layer.entries.map((entry, entryIndex) => (
                          <div
                            key={`${layer.layerTitle}-${entry.title}-${entryIndex}`}
                            className="rounded-lg p-3"
                            style={{
                              border: `1px solid ${color}26`,
                              background: `linear-gradient(145deg, rgba(0,0,0,0.25), ${color}08)`,
                            }}
                          >
                            <div className="text-sm md:text-[0.95rem] font-semibold text-white/88 leading-relaxed">
                              {entry.title}
                            </div>

                            {entry.bullets.length > 0 && (
                              <ul className="mt-2 space-y-1.5">
                                {entry.bullets.map((bullet, bulletIndex) => (
                                  <li key={`${entry.title}-${bulletIndex}`} className="flex items-start gap-2 text-sm text-white/74 leading-relaxed">
                                    <span
                                      className="mt-[8px] h-1.5 w-1.5 rounded-full flex-shrink-0"
                                      style={{ background: `${color}A8` }}
                                    />
                                    <span>{bullet}</span>
                                  </li>
                                ))}
                              </ul>
                            )}

                            {entry.summary && (
                              <div className="mt-2.5 flex items-start gap-2 text-sm text-white/76 leading-relaxed">
                                <ChevronRight size={14} className="mt-[2px] flex-shrink-0" style={{ color: `${color}A6` }} />
                                <span>{entry.summary}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {layer.notes.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {layer.notes.map((note, noteIndex) => (
                          <div key={`${layer.layerTitle}-note-${noteIndex}`} className="text-sm text-white/70 leading-relaxed">
                            {note}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── 系统课程训练组件（系统页专用）─── */
function SystemTrainingBlock({
  color,
  training,
}: {
  color: string;
  training: NonNullable<DiceFace["systemTraining"]>;
}) {
  return (
    <div
      className="rounded-2xl p-6 md:p-8 space-y-5"
      style={{
        background: `linear-gradient(145deg, ${color}12, ${color}06)`,
        border: `1px solid ${color}28`,
      }}
    >
      <div
        className="text-sm tracking-[0.16em] uppercase font-semibold"
        style={{ color: `${color}CC`, fontFamily: "var(--font-label)" }}
      >
        {training.title}
      </div>
      <div className="space-y-3">
        {training.items.map((item) => (
          <div key={item} className="flex items-start gap-2 text-sm text-white/72 leading-relaxed">
            <ChevronRight size={14} className="mt-0.5 flex-shrink-0" style={{ color: `${color}85` }} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── 实际应用列表（系统页专用）─── */
function SystemApplicationList({ color, items }: { color: string; items: string[] }) {
  return (
    <div
      className="rounded-2xl p-6 md:p-8"
      style={{
        background: `linear-gradient(145deg, ${color}12, ${color}06)`,
        border: `1px solid ${color}28`,
      }}
    >
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-2 text-sm text-white/72 leading-relaxed">
            <ChevronRight size={14} className="mt-0.5 flex-shrink-0" style={{ color: `${color}85` }} />
            <span>{item}</span>
          </div>
        ))}
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
  projects: AlgorithmProject[];
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
  // 中文注释：当前高亮的时间节点（悬停/点击时更新）
  const [activeIndex, setActiveIndex] = useState(0);
  if (!timeline || timeline.length === 0) return null;

  // 中文注释：时间轴轨道的起止位置与进度百分比（用于主线高亮动画）
  const timelineCount = timeline.length;
  const trackEdgePercent = timelineCount > 1 ? 100 / (timelineCount * 2) : 50;
  const trackSpanPercent = 100 - trackEdgePercent * 2;
  const progressRatio = timelineCount > 1 ? activeIndex / (timelineCount - 1) : 1;
  const horizontalProgressWidth = trackSpanPercent * progressRatio;

  return (
    <div className="relative">
      {/* 中文注释：桌面端横向底轨道 */}
      <div
        className="hidden md:block absolute top-[10px] h-[3px] rounded-full"
        style={{
          left: `${trackEdgePercent}%`,
          right: `${trackEdgePercent}%`,
          background: `linear-gradient(90deg, ${color}20, ${color}0A)`,
        }}
      />

      {/* 中文注释：桌面端横向高亮进度线（会随 activeIndex 变化） */}
      <motion.div
        className="hidden md:block absolute top-[10px] h-[3px] rounded-full"
        style={{
          left: `${trackEdgePercent}%`,
          background: `linear-gradient(90deg, ${color}F0, ${color}55)`,
          boxShadow: `0 0 14px ${color}55`,
        }}
        initial={{ scaleX: 0, opacity: 0.5 }}
        animate={{ width: `${horizontalProgressWidth}%`, opacity: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* 中文注释：移动端保持纵向轨道，避免小屏挤压 */}
      <div
        className="md:hidden absolute left-[8px] top-3 bottom-3 w-[2px] rounded-full"
        style={{ background: `linear-gradient(180deg, ${color}20, ${color}0A)` }}
      />
      <motion.div
        className="md:hidden absolute left-[8px] top-3 bottom-3 w-[2px] origin-top rounded-full"
        style={{ background: `linear-gradient(180deg, ${color}E8, ${color}3A)` }}
        animate={{ scaleY: progressRatio || 0.01, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        {timeline.map((item, i) => {
          const isActive = i === activeIndex;
          return (
            <motion.button
              key={item.period}
              type="button"
              onMouseEnter={() => setActiveIndex(i)}
              onFocus={() => setActiveIndex(i)}
              onClick={() => setActiveIndex(i)}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: i * 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full text-left pl-10 md:pl-0 pt-0 md:pt-6"
            >
              {/* 中文注释：交互节点（双层圆点 + 脉冲环，强调时间轴交互反馈） */}
              <motion.div
                className="absolute left-[1px] md:left-1/2 md:-translate-x-1/2 top-[2px] md:top-0 w-[16px] h-[16px] rounded-full border-2 z-10"
                style={{
                  borderColor: isActive ? `${color}` : `${color}95`,
                  background: isActive ? `${color}38` : `${color}1F`,
                }}
                animate={
                  isActive
                    ? {
                        scale: [1, 1.15, 1],
                        boxShadow: [`0 0 0 0 ${color}55`, `0 0 0 12px ${color}00`, `0 0 0 0 ${color}00`],
                      }
                    : { scale: 1, boxShadow: `0 0 0 0 ${color}00` }
                }
                transition={
                  isActive
                    ? { duration: 1.35, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.2, ease: "easeOut" }
                }
              />
              <motion.div
                className="absolute left-[5px] md:left-1/2 md:-translate-x-1/2 top-[6px] md:top-[4px] w-[8px] h-[8px] rounded-full z-10"
                style={{ background: isActive ? `${color}F0` : `${color}A8`, boxShadow: isActive ? `0 0 10px ${color}90` : "none" }}
                animate={isActive ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                transition={{ duration: 1, repeat: isActive ? Infinity : 0, ease: "easeInOut" }}
              />

              {/* 中文注释：卡片与时间节点联动高亮，强调当前选中时间段 */}
              <motion.div
                className="rounded-xl px-3 py-3 md:px-4 md:py-4 md:min-h-[280px]"
                animate={{
                  x: isActive ? 0 : -2,
                  y: isActive ? -4 : 0,
                  opacity: isActive ? 1 : 0.93,
                  boxShadow: isActive ? `0 12px 28px ${color}26` : `0 6px 14px ${color}12`,
                }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${color}14, ${color}08)`
                    : `${color}07`,
                  border: `1px solid ${isActive ? `${color}3F` : `${color}18`}`,
                }}
              >
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
            </motion.button>
          );
        })}
      </div>

      <div className="mt-3 hidden md:flex items-center justify-end text-[11px] tracking-[0.12em] text-white/45">
        悬停或点击节点以查看时间轴高亮
      </div>
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
  const [browserZoomScale, setBrowserZoomScale] = useState(1);
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    // 中文注释：按 visualViewport.scale 读取浏览器缩放，避免 localhost 与线上域名缩放不一致导致分支页视觉比例不同
    const syncBrowserZoomScale = () => {
      const zoom = window.visualViewport?.scale ?? 1;
      setBrowserZoomScale(zoom > 0 ? zoom : 1);
    };

    syncBrowserZoomScale();
    window.addEventListener("resize", syncBrowserZoomScale);
    window.visualViewport?.addEventListener("resize", syncBrowserZoomScale);
    window.visualViewport?.addEventListener("scroll", syncBrowserZoomScale);

    return () => {
      window.removeEventListener("resize", syncBrowserZoomScale);
      window.visualViewport?.removeEventListener("resize", syncBrowserZoomScale);
      window.visualViewport?.removeEventListener("scroll", syncBrowserZoomScale);
    };
  }, []);

  const zoomCompensation = browserZoomScale > 0 ? 1 / browserZoomScale : 1;

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
      className="fixed inset-0 z-50 bg-[#080808] branch-readable"
      // 中文注释：分支页补偿浏览器缩放（例如 localhost=110%，线上=100%），确保两端视觉尺寸一致
      style={{ zoom: `${zoomCompensation}` }}
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
          <header className="flex items-center justify-between px-4 md:px-6 lg:px-8 py-6 backdrop-blur-sm">
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
          {/* 中文注释：统一收窄分支页左右空白（约压到原来的 1/3） */}
          <main className={isVisualFace ? "flex-1 px-2 md:px-3 lg:px-4 pb-16" : "flex-1 px-2 md:px-4 lg:px-6 pb-16"}>
            {/* 中文注释：分支页主容器采用固定设计上限宽度，避免不同 viewport 下版式拉伸漂移 */}
            <div
              className="w-full mx-auto"
              style={{ maxWidth: `${BRANCH_CONTENT_MAX_WIDTH_PX}px` }}
            >

              {/* ═══ 视觉分支 ═══ */}
              {isVisualFace && (
                <div className="grid grid-cols-1 pt-0">
                  <div className="space-y-8">

                    {/* Visual Hero 区域 */}
                    {/* 中文注释：视觉页与算法页对齐，标题区到首个模块间距统一为 20px */}
                    <div className="px-2 md:px-4 lg:px-5 mb-[20px]">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                      >
                        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
                          {/* 左侧：标题区 */}
                          <div className="space-y-[0.1rem]">
                            <div
                              className="text-2xl tracking-[0.18em] uppercase font-semibold"
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
                <div className="pt-0">
                  {/* Hero 区域 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    // 中文注释：所有非视觉分支统一参考算法页（ALGORITHM -> PAPER SPOTLIGHT）的 20px 间距
                    className="mb-[20px]"
                  >
                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
                      {/* 左侧：标题区 */}
                      <div className="space-y-[0.1rem]">
                        {/* 副标题 */}
                        <div
                          // 中文注释：统一副标题字号与字距，匹配算法页 ALGORITHM 的视觉权重
                          className="text-2xl tracking-[0.18em] uppercase font-semibold"
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

                  {/* 中文注释：按需求统一去掉此处分隔线，让所有分支过渡节奏与算法页一致 */}

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
                          {/* 中文注释：继承分支页主容器宽度，不再使用 viewport 比例宽度 */}
                          <div className="w-full">
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

                  {/* ─── 系统分支：按用户最新文本重建全部内容 ─── */}
                  {face.id === 4 && (
                    <>
                      {face.systemAbilityTree && (
                        <div className="mb-12 lg:mb-16">
                          <SectionTitle title="个人的系统能力体系" color={face.color} />
                          <SystemAbilityTree treeText={face.systemAbilityTree} color={face.color} />
                        </div>
                      )}

                      {face.systemLanguageCapability && (
                        <div className="mb-12 lg:mb-16">
                          <SectionTitle title="编程语言能力" color={face.color} />
                          <ProgrammingLanguageCapability color={face.color} capability={face.systemLanguageCapability} />
                        </div>
                      )}

                      {face.systemTraining && (
                        <div className="mb-12 lg:mb-16">
                          <SectionTitle title="系统课程训练" color={face.color} />
                          <SystemTrainingBlock color={face.color} training={face.systemTraining} />
                        </div>
                      )}

                      {face.systemCapabilities && (
                        <div className="mb-12 lg:mb-16">
                          <SectionTitle title="系统能力" color={face.color} />
                          <SystemCapabilityCards capabilities={face.systemCapabilities} color={face.color} />
                        </div>
                      )}

                      {face.systemApplications && face.systemApplications.length > 0 && (
                        <div className="mb-12 lg:mb-16">
                          <SectionTitle title="实际应用" color={face.color} />
                          <SystemApplicationList color={face.color} items={face.systemApplications} />
                        </div>
                      )}

                      {face.systemProjects && face.systemProjects.length > 0 && (
                        <div className="mb-12 lg:mb-16">
                          <SectionTitle title="实战项目" color={face.color} />
                          <AlgorithmProjects projects={face.systemProjects} color={face.color} />
                        </div>
                      )}
                    </>
                  )}

                  {/* ─── 跨界分支：教育轨迹 + 跨界能力 + 独特价值 ─── */}
                  {face.id === 5 && (
                    <>
                      {face.educationTimeline && (
                        <div className="mb-12 lg:mb-16">
                          <SectionTitle title="教育轨迹" color={face.color} />
                          {/* 中文注释：教育轨迹改为横向时间轴后放开宽度，避免右侧留白 */}
                          <div className="max-w-none">
                            <EducationTimeline timeline={face.educationTimeline} color={face.color} />
                          </div>
                        </div>
                      )}

                      {face.hybridAdvantages && (
                        <div className="mb-12 lg:mb-16">
                          <SectionTitle title="跨界能力的具体体现" color={face.color} />
                          <div
                            className="text-sm md:text-base text-white/78 mb-6"
                            style={{ fontFamily: "var(--font-body)" }}
                          >
                            技术 × 艺术的双向转化
                          </div>
                          <HybridAdvantages advantages={face.hybridAdvantages} color={face.color} />

                          {face.uniqueValue && (
                            <motion.div
                              initial={{ opacity: 0, y: 12 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              className="mt-8 rounded-2xl p-6 md:p-8 relative overflow-hidden"
                              style={{
                                background: `linear-gradient(145deg, ${face.color}10, ${face.color}05)`,
                                border: `1px solid ${face.color}25`,
                              }}
                            >
                              <div
                                className="absolute inset-0 opacity-18"
                                style={{ background: `radial-gradient(circle at 30% 25%, ${face.color}35, transparent 64%)` }}
                              />
                              <div className="relative z-10">
                                <div
                                  className="text-xs tracking-[0.34em] uppercase mb-3 text-white/45 font-semibold"
                                  style={{ fontFamily: "var(--font-label)" }}
                                >
                                  独特价值
                                </div>
                                <div
                                  className="text-lg md:text-xl text-white/88 mb-4"
                                  style={{ fontFamily: "var(--font-display)" }}
                                >
                                  {face.uniqueValue.title}
                                </div>
                                <div className="space-y-3">
                                  {face.uniqueValue.items.map((item) => (
                                    <div key={item} className="flex items-start gap-2 text-sm text-white/68 leading-relaxed">
                                      <ChevronRight size={14} className="mt-0.5 flex-shrink-0" style={{ color: `${face.color}8A` }} />
                                      <span>{item}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}

                          <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="mt-8 text-center"
                          >
                            <div
                              className="text-xs tracking-[0.3em] uppercase mb-3 text-white/45 font-semibold"
                              style={{ fontFamily: "var(--font-label)" }}
                            >
                              核心竞争力
                            </div>
                            <div
                              className="inline-block px-6 py-3 rounded-full text-sm font-medium"
                              style={{
                                color: `${face.color}DD`,
                                background: `${face.color}10`,
                                border: `1px solid ${face.color}25`,
                              }}
                            >
                              {face.coreCompetence ?? "技术艺术化转化能力 · 跨领域问题解决方案 · 完整产品交付能力"}
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
                              {/* 中文注释：按需求把“游戏概念”文案直接放在标题下方，不再做独立信息卡 */}
                              <div className="mt-4 space-y-3 text-sm md:text-base leading-relaxed text-white/85 max-w-3xl">
                                <p>
                                  游戏概念
                                </p>
                                <p>
                                  一个关于“认识自己”的轻量级对话游戏——通过简短的对话，AI 会为你生成独特的“特质碎片”，收集足够的碎片就能组成一颗完整的骰子。
                                </p>
                                <p>
                                  我的发心：我相信人的可能性是无限的，也相信文字有巨大的能量——或许一次文字的流动，能让我的朋友们发现自己的可能性。
                                </p>
                              </div>
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

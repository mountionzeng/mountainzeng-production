/**
 * diceData.ts — 网站核心数据文件
 *
 * 这里是整个网站所有文案和内容的唯一来源。
 * 如果你想修改网站内容，只需要编辑这个文件。
 *
 * 数据结构说明：
 * - DICE_FACES：六个维度的完整数据数组，顺序对应骰子六面
 * - 每个维度包含首页文案（homeDescription）和详情页文案（description）
 * - 首页只展示：homeDescription、skills、buttonText
 * - 详情页展示：description、quote、coreStatement 以及各维度专属字段
 */

// ─── 类型定义 ───────────────────────────────────────────────────────────────

/** 作品/项目卡片 */
export interface WorkItem {
  title: string;
  placeholder: boolean;
  description?: string;
  role?: string;
  highlights?: string[];
  tags?: string[];
}

/** 职业经历时间线条目 */
export interface TimelineItem {
  period: string;
  company: string;
  role: string;
  projects: string[];
}

/** 知识体系论文分节 */
export interface KnowledgePaperSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  image?: {
    src: string;
    alt: string;
    caption?: string;
  };
  links?: {
    label: string;
    href: string;
  }[];
}

/** 知识体系长文论文 */
export interface KnowledgePaper {
  title: string;
  summary: string;
  keywords?: string[];
  sections: KnowledgePaperSection[];
}

/** 算法知识体系层级 */
export interface KnowledgeLevel {
  level: string;
  items: string[];
  papers?: KnowledgePaper[];
}

/** 算法分支课程实践 */
export interface AlgorithmCourseDetail {
  title: string;
  code: string;
  depth: string;
  summary: string;
  topics: string[];
  practice?: string;
}

/** 算法分支应用方向 */
export interface AlgorithmApplicationArea {
  title: string;
  subtitle: string;
  description?: string;
  clusters: {
    title: string;
    items: string[];
  }[];
}

/** 算法分支实战项目 */
export interface AlgorithmProject {
  title: string;
  subtitle: string;
  status: string;
  summary: string;
  techStack: string[];
  features?: string[];
  highlights?: string[];
  architecture?: {
    title: string;
    description: string;
  }[];
  outcomes?: string[];
  openSourceNote?: string;
}

/** 骰子单面（一个维度）的完整数据结构 */
export interface DiceFace {
  /** 维度编号，1-6 */
  id: number;
  /** 中文标题，例如"视觉" */
  title: string;
  /** Tab 英文标签，显示在首页标签栏 */
  tabLabel: string;
  /** 英文副标题，显示在详情页 */
  subtitle: string;
  /** 主题色（十六进制），控制该维度的所有高亮颜色 */
  color: string;
  /** Lucide 图标名称，或 emoji 字符串 */
  icon: string;

  // ── 首页展示内容 ──────────────────────────────────────────────────────────
  /** 首页卡片文案（若不填则自动使用 description） */
  homeDescription?: string;
  /** 首页技能标签列表 */
  skills: string[];
  /** 首页按钮文字 */
  buttonText: string;

  // ── 详情页展示内容 ────────────────────────────────────────────────────────
  /** 详情页主描述文案 */
  description: string;
  /** 详情页引言 */
  quote: string;
  /** 详情页核心定位语（小标题） */
  coreStatement?: string;
  /** 作品/项目列表 */
  works: WorkItem[];

  // ── 各维度专属字段（详情页使用） ─────────────────────────────────────────
  /** 数据统计卡片（视觉、产品、系统维度使用） */
  stats?: { label: string; value: string }[];
  /** 职业经历时间线（视觉维度使用） */
  timeline?: TimelineItem[];
  /** 算法知识体系链条（算法维度使用） */
  knowledgeChain?: KnowledgeLevel[];
  /** 算法课程实践（算法维度使用） */
  algorithmCourseDetails?: AlgorithmCourseDetail[];
  /** 算法应用方向（算法维度使用） */
  algorithmApplicationAreas?: AlgorithmApplicationArea[];
  /** 算法实战项目（算法维度使用） */
  algorithmProjects?: AlgorithmProject[];
  /** 系统课程列表（系统维度使用） */
  systemCourses?: { code: string; name: string }[];
  /** 个人系统能力体系树（系统维度使用） */
  systemAbilityTree?: string;
  /** 编程语言能力（系统维度使用） */
  systemLanguageCapability?: {
    lowerLayerTitle: string;
    lowerLanguages: string;
    lowerAction: string;
    lowerTargets: string;
    lowerInfrastructure: string;
    upperLayerTitle: string;
    upperLanguages: string;
    upperAction: string;
    upperTargets: string;
    coreLanguages: string;
    supplementMethod: string;
  };
  /** 系统课程训练模块（系统维度使用） */
  systemTraining?: {
    title: string;
    items: string[];
  };
  /** 系统能力模块（系统维度使用） */
  systemCapabilities?: { title: string; items: string[] }[];
  /** 实际应用（系统维度使用） */
  systemApplications?: string[];
  /** 系统实战项目（系统维度使用） */
  systemProjects?: AlgorithmProject[];
  /** 教育轨迹（跨界维度使用） */
  educationTimeline?: {
    period: string;
    school: string;
    degree: string;
    direction: string;
    cultivation: string;
  }[];
  /** 跨界优势（跨界维度使用） */
  hybridAdvantages?: { title: string; description: string }[];
  /** 跨界独特价值（跨界维度使用） */
  uniqueValue?: {
    title: string;
    items: string[];
  };
  /** 核心竞争力（跨界维度使用） */
  coreCompetence?: string;
  /** 未来方向（未来维度使用） */
  futureDirections?: { title: string; items: string[] }[];
  /** 联系方式（未来维度使用） */
  contactInfo?: { type: string; value: string; icon: string }[];
}

// ─── 数据 ────────────────────────────────────────────────────────────────────

export const DICE_FACES: DiceFace[] = [
  // ── 01 视觉 ──────────────────────────────────────────────────────────────
  {
    id: 1,
    title: "视觉",
    tabLabel: "视觉",
    subtitle: "VISUAL",
    color: "#4A7BF7",
    icon: "Palette",

    homeDescription:
      "我相信感性和敏锐是一种天赋，它让我能捕捉到不可名状的情绪。七年影视美术经验告诉我，我有能力把抽象的感受转化为具体的画面。从《长安三万里》的盛唐诗意到《深海》的情绪张力，美术是我传递细腻情感的工具。也是我一切能力的起点。",
    skills: ["数字绘景（Matte Painting）", "美术指导（Art Direction）", "多风格兼容（古风/科幻/写实）"],
    buttonText: "看看小曾创造的美丽图片",

    description:
      "七年一线影视项目经验，参与《长安三万里》《深海》《白蛇》等电影制作。美术功底，也是我开始一切创作的底气。",
    quote: "艺术不是你看到的，而是你让别人看到的。",
    coreStatement: "情绪的可视化",
    stats: [
      { label: "一线项目经验", value: "7年" },
      { label: "参与电影级项目", value: "10+" },
    ],
    works: [
      // 中文注释：按需求将视觉分支三张项目卡片改为“公司|职位 + 时间 + 关键成果”模块
      {
        title: "追光动画 | 数字绘景师",
        placeholder: false,
        description: "2022.10 - 2025.5",
        highlights: [
          "全流程参与《长安三万里》《白蛇-浮生》《聊斋》场景美术绘制",
          "自主开发 Matte Painting 专用插件，重构图像处理流程",
          "在《长安三万里》中应用投射拼接技术，提升画面一致性与制作效率",
        ],
      },
      {
        title: "原力动画 | 数字绘景组长",
        placeholder: false,
        description: "2020.10 - 2022.5",
        highlights: [
          "主导《深海》《巨怪猎人：泰坦猎人》（梦工厂）场景制作，输出美术标杆镜头",
          "定义《英雄联盟》《王者荣耀》等手游过场动画的美术风格及质量标准",
          "完成《哈利·波特》（网易游戏）首曝美宣海报制作",
          "负责《凡人修仙传》前期视觉探索，优化流程缩短 2/3 制作周期",
        ],
      },
      {
        title: "宝琳创展 | Generalist",
        placeholder: false,
        description: "2019.3 - 2020.10",
        highlights: [
          "参与《侍神令》《Kingdom 2》(Netflix 韩剧）《The Righteous Gemstones》(HBO 美剧）等国际影视项目的 Matte Painting 工作",
          "提前介入 CCTV《澳门人家》前期特效分镜制作，降低跨国沟通成本",
          "运用手绘技法实现 3D 难以达成的视觉效果，填补技术空白",
        ],
      },
    ],
    timeline: [
      {
        period: "2022.10 - 2025.5",
        company: "追光动画",
        role: "数字绘景师",
        projects: ["《长安三万里》", "《白蛇》系列", "《聊斋》"],
      },
      {
        period: "2020.10 - 2022.5",
        company: "原力动画",
        role: "数字绘景组长",
        projects: ["《深海》", "《巨怪猎人》", "《英雄联盟》手游", "《哈利波特》"],
      },
      {
        period: "2019.3 - 2020.10",
        company: "宝琳创展",
        role: "Matte Painting 多面手",
        projects: ["《侍神令》", "《Kingdom 2》Netflix", "HBO美剧"],
      },
    ],
  },

  // ── 02 产品 ──────────────────────────────────────────────────────────────
  {
    id: 2,
    title: "产品",
    tabLabel: "产品",
    subtitle: "PRODUCT MANAGEMENT",
    color: "#6B6BF7",
    icon: "Target",

    homeDescription:
      "但光有美感还不够，我需要让每一个想法都能被人真切地体验和感知到。这驱使我从需求分析到开发实现一手包办。写插件、搭工具，把重复劳动自动化。我的产品思维不是文档和会议，而是真正能解决问题的代码和界面。这样一步步做下来，我不只是创造美丽的画面，也能把想法变成真实可用的产品。",
    skills: ["企业经营", "客户管理", "需求分析", "工具开发", "流程优化"],
    buttonText: "了解一下产品小岱",

    description: "",
    quote: "好的产品，是对人性最深刻的理解。",
    coreStatement: "从想法到落地",
    stats: [],
    works: [
      {
        title: "曦岱工作室：从执行者到经营者",
        placeholder: false,
        description: "成立个人工作室'曦岱'，具备独立报税、开发票能力",
        role: "创始人",
        highlights: [
          "承接中宣部订单，服务国家级项目",
          "签约东方梦工厂，参与国际级动画制作",
          "验证从个人贡献者到企业经营者的一人公司能力",
        ],
        tags: ["企业经营", "客户管理"],
      },
      {
        title: "Who am I, How are you",
        placeholder: false,
        description: "AI 驱动的自我认知与社交匹配网站",
        role: "产品 + UI/UX + 前端 + 大语言模型训练（全栈独立完成）",
        highlights: [
          "洞察：真正的连接始于对自我的理解——先认清自己，才能找到同频的人",
          "2 天黑客松极限开发，验证 AI+社交的产品可行性",
        ],
        tags: ["AI社交", "全栈开发"],
      },
      {
        title: "工具开发：MP 专用插件",
        placeholder: false,
        description: "自主开发 NUKE/MP 插件，自动化重复步骤",
        role: "工具开发者",
        highlights: [
          "痛点：传统流程重复劳动多，效率低",
          "方案：自主开发 NUKE/MP 插件，自动化重复步骤",
          "效率提升 300%，团队推广使用",
        ],
        tags: ["Python/NUKE", "流程优化"],
      },
    ],
  },

  // ── 03 算法 ──────────────────────────────────────────────────────────────
  {
    id: 3,
    title: "算法",
    tabLabel: "算法",
    subtitle: "ALGORITHM",
    color: "#8B5CF6",
    icon: "Binary",

    homeDescription:
      "而做产品的过程中，我发现数学思维让我的行为更简洁高效。它教会我如何抽象问题、寻找模式、在复杂度与效率之间找到平衡。这种严谨的思维方式，成为我理解算法和 AI 本质的基础。",
    skills: [],
    buttonText: "👀Xiangyu的数学作业～",

    description: "",
    quote: "",
    knowledgeChain: [
      {
        level: "数学基础",
        // 中文注释：按用户提供的参考图，数学基础固定为 5 个标签
        items: ["线性代数", "微积分与优化", "概率论", "回归分析", "分类方法"],
        papers: [
          {
            title: "第2章：线性代数（Linear Algebra）- 详解",
            summary:
              "线性代数是机器学习描述数据、模型和算法变换方式的语言。它把抽象的向量空间、线性映射与具体的矩阵运算连接起来，也是视觉计算、PCA、相机几何与神经网络权重理解的基础。",
            keywords: ["向量空间", "矩阵", "线性映射", "基与秩", "PCA", "相机几何"],
            sections: [
              {
                heading: "我的笔记",
                paragraphs: ["在这里记录你对论文核心观点、公式和实验结果的理解。"],
                bullets: ["问题定义", "核心公式", "实验结论", "你自己的思考"],
              },
            ],
          },
          {
            title: "微积分与优化长论文",
            summary: "用于梳理导数、偏导、链式法则与优化理论在训练与控制中的意义。",
            keywords: ["导数", "梯度", "链式法则", "优化"],
            sections: [
              {
                heading: "我的笔记",
                paragraphs: ["在这里记录你对优化目标、收敛行为和训练稳定性的理解。"],
                bullets: ["核心概念", "推导过程", "实验对比", "工程取舍"],
              },
            ],
          },
          {
            title: "概率论长论文",
            summary: "用于解释随机变量、分布、条件概率与贝叶斯直觉在 AI 生成与推断中的作用。",
            keywords: ["概率分布", "条件概率", "随机变量", "贝叶斯"],
            sections: [
              {
                heading: "我的笔记",
                paragraphs: ["在这里记录你对概率建模与不确定性推断的理解。"],
                bullets: ["核心概念", "推导过程", "应用场景", "开放问题"],
              },
            ],
          },
          {
            title: "回归分析长论文",
            summary: "用于讲清回归问题如何从连续值预测延伸到参数估计与趋势建模。",
            keywords: ["线性回归", "残差", "拟合", "参数估计"],
            sections: [
              {
                heading: "我的笔记",
                paragraphs: ["在这里记录你对回归建模假设、误差分析与泛化表现的理解。"],
                bullets: ["问题定义", "模型假设", "误差分析", "实验结果"],
              },
            ],
          },
          {
            title: "分类方法论文",
            summary: "用于整理判别边界、特征空间与分类模型在视觉识别中的作用。",
            keywords: ["决策边界", "特征空间", "分类模型", "损失函数"],
            sections: [
              {
                heading: "我的笔记",
                paragraphs: ["在这里记录你对分类策略、边界学习与评估指标的理解。"],
                bullets: ["判别思路", "特征工程", "评价指标", "失败案例"],
              },
            ],
          },
        ],
      },
      {
        level: "算法原理",
        items: ["梯度下降", "反向传播", "损失函数", "正则化"],
        papers: [
          {
            title: "在这里替换成你的机器学习原理论文标题",
            summary: "用于说明学习目标、损失函数与泛化能力之间的关系。",
            keywords: ["损失函数", "泛化", "偏差方差", "正则化"],
            sections: [
              {
                heading: "我的笔记",
                paragraphs: ["在这里记录论文方法假设、算法流程与实验对比。"],
                bullets: ["假设前提", "算法流程", "对比实验", "局限性"],
              },
            ],
          },
        ],
      },
      {
        level: "模型结构",
        items: ["CNN", "Transformer", "扩散模型", "RNN/LSTM"],
        papers: [
          {
            title: "在这里替换成你的模型结构论文标题",
            summary: "用于理解模型架构演进与各模块协同机制。",
            keywords: ["网络结构", "注意力机制", "模块设计", "可扩展性"],
            sections: [
              {
                heading: "我的笔记",
                paragraphs: ["在这里记录网络结构设计动机与关键模块作用。"],
                bullets: ["架构图", "关键模块", "训练策略", "性能指标"],
              },
            ],
          },
        ],
      },
      {
        level: "具体应用",
        items: ["图像生成", "自然语言处理", "计算机视觉"],
        papers: [
          {
            title: "在这里替换成你的应用论文标题",
            summary: "用于总结模型在具体业务场景中的可落地性与边界。",
            keywords: ["应用场景", "效果评估", "工程化", "部署"],
            sections: [
              {
                heading: "我的笔记",
                paragraphs: ["在这里记录任务设定、评估指标与真实应用价值。"],
                bullets: ["任务定义", "评估指标", "结果分析", "下一步迭代"],
              },
            ],
          },
        ],
      },
    ],
    algorithmCourseDetails: [
      {
        title: "机器学习",
        code: "CS586",
        depth: "深度 88%",
        summary: "线性回归、逻辑回归的数学推导与实现。",
        topics: [
          "线性回归、逻辑回归的数学推导与实现",
          "梯度下降算法的优化策略（SGD、Adam、RMSprop）",
          "正则化技术（L1/L2）在过拟合控制中的应用",
        ],
        practice: "实战：从零实现完整的机器学习管线",
      },
      {
        title: "深度学习",
        code: "CS583",
        depth: "深度 76%，8 月完成",
        summary: "神经网络的反向传播算法推导。",
        topics: [
          "神经网络的反向传播算法推导",
          "CNN 架构演进：从 LeNet 到 ResNet",
          "Transformer 注意力机制的数学原理",
          "扩散模型（Stable Diffusion）的生成原理",
        ],
        practice: "实战：训练自定义图像分类模型",
      },
      {
        title: "自然语言处理",
        code: "CS584",
        depth: "深度 72%",
        summary: "词嵌入技术（Word2Vec、GloVe）。",
        topics: [
          "词嵌入技术（Word2Vec、GloVe）",
          "语言模型的演进：从 RNN 到 GPT",
          "Transformer 在 NLP 中的应用",
        ],
        practice: "实战：构建基于 LLM 的对话系统（应用于 AI 社交产品）",
      },
    ],
    algorithmApplicationAreas: [
      {
        title: "计算机视觉（CV）—— AI 美术",
        subtitle: "AI 美术",
        description: "将 AI 技术融入影视美术工作流",
        clusters: [
          {
            title: "图像处理算法",
            items: [
              "图像分割、边缘检测在 Matte Painting 中的应用",
              "色彩空间转换与色彩匹配算法",
              "基于深度学习的图像超分辨率",
            ],
          },
          {
            title: "重构 MP 工作流程",
            items: [
              "使用 ControlNet 实现精确的构图控制",
              "结合传统绘景与 AI 生成的混合工作流",
              "自动化投射拼接技术的算法优化",
            ],
          },
          {
            title: "插件底层实现",
            items: [
              "NUKE 插件中的图像处理算法集成",
              "OpenCV 与 NUKE API 的结合应用",
              "实时预览的性能优化策略",
            ],
          },
        ],
      },
      {
        title: "计算机图形学（CG）—— 传统电脑美术",
        subtitle: "传统电脑美术",
        description: "理解渲染原理，连接艺术与技术",
        clusters: [
          {
            title: "图形学基础与实践",
            items: [
              "实时渲染管线理解与应用",
              "着色器编程（Shader）",
              "3D 图形管线与视觉特效",
            ],
          },
        ],
      },
      {
        title: "AI 美术工具",
        subtitle: "工具链",
        description: "",
        clusters: [
          {
            title: "Midjourney 高级应用",
            items: [
              "Prompt Engineering 的系统化方法",
              "参数调优策略（--stylize, --chaos, --quality）",
              "多图混合与风格迁移技术",
            ],
          },
          {
            title: "ComfyUI 工作流设计",
            items: [
              "节点式工作流的逻辑设计",
              "ControlNet、LoRA、Embedding 的组合应用",
              "批量生成与自动化脚本",
              "实战：构建可复用的影视美术生成流程",
            ],
          },
          {
            title: "AI 生成图像的后期优化",
            items: [
              "AI 图像的常见问题识别（手部、透视、细节）",
              "传统修图与 AI 修复的结合策略",
              "Inpainting 技术的精准应用",
              "色彩校正与风格统一",
            ],
          },
        ],
      },
      {
        title: "持续学习",
        subtitle: "Research Frontier",
        description: "",
        clusters: [
          {
            title: "持续学习",
            items: [
              "关注最新的 AI 论文（arXiv）",
              "参与开源项目贡献（GitHub）",
              "实验前沿技术（SORA、Runway Gen-3）",
            ],
          },
        ],
      },
    ],
    algorithmProjects: [],
    works: [],
  },

  // ── 04 系统 ──────────────────────────────────────────────────────────────
  {
    id: 4,
    title: "系统",
    tabLabel: "系统",
    subtitle: "COMPUTER SYSTEM",
    color: "#A855F7",
    icon: "Settings",

    homeDescription:
      "我很享受产出大量美丽图案的过程，但如果想让这个过程更高效、更稳定，我就必须理解计算机的底层逻辑和系统思维。只有深入到这一层，才能真正把算法产品化。",
    skills: ["插件开发", "性能优化", "工作流程设计", "系统架构"],
    buttonText: "《岱岱和计算机的量子纠缠》",

    description: "",
    quote: "",
    coreStatement: "深入底层逻辑",
    systemAbilityTree: `个人的系统能力体系
│
├── 【第一层：编程基础】
│   └── CS501 Java 编程概述
│       • 面向对象编程思想
│       • 基础语法和编程范式
│       ↓ 提供编程能力基础
│
├── 【第二层：数据与算法】
│   ├── CS570 数据结构 (已完成)
│   │   • 线性结构：数组、链表、栈、队列
│   │   • 树结构：二叉树、AVL树、B树
│   │   • 图结构：图的表示与遍历
│   │   ↓ 为算法提供数据组织方式
│   │
│   └── CS590 算法 (已完成)
│       • Module 1: 算法分析 (复杂度理论)
│       • Module 2-6: 基础数据结构深化
│         - 二叉搜索树、优先队列、哈希表、并查集
│       • Module 7: 排序与选择算法
│       • Module 8-10: 算法设计范式
│         - 贪心法、分治法、动态规划
│       • Module 11-13: 图算法
│         - 图遍历、最短路径、最小生成树
│       ↓ 为系统设计提供效率保证和问题解决方法论
│
├── 【第三层：系统底层】（理论与实践并行）
│   │
│   ├── CS525 系统编程 (78% - 实践导向)
│   │   • Module 2-5: C 语言系统编程基础
│   │     - 数组、函数、结构体、指针
│   │     - 搜索、排序、递归、I/O
│   │   • Module 6-7: 文件系统与 Shell
│   │     - 文件和目录操作
│   │     - Shell 脚本编程
│   │   • Module 8-10: 进程与线程编程
│   │     - 进程创建与管理
│   │     - 信号处理机制
│   │     - 多线程编程与守护进程
│   │   • Module 11-12: 进程间通信 (IPC)
│   │     - 管道 (Pipes)
│   │     - 套接字 (Sockets)
│   │   • Module 13: 库的使用与创建
│   │   ↓ 实践层面：如何使用操作系统提供的 API
│   │
│   └── CS520 操作系统概论 (78% - 理论导向)
│       • Module 1: 操作系统概览
│       • Module 2-3: 进程管理
│         - 进程与线程模型
│         - 并发与调度算法
│       • Module 4-5: 同步与死锁
│         - 互斥与同步机制
│         - 死锁预防、避免、检测与恢复
│       • Module 6-7: 内存管理
│         - 主存管理 (分区、分页、分段)
│         - 虚拟内存 (页面置换算法)
│       • Module 8-10: 存储与文件系统
│         - 大容量存储与 I/O 系统
│         - 文件系统接口
│         - 文件系统实现与内部结构
│       • Module 11-12: 安全与保护
│         - 系统安全机制
│         - 访问控制与保护
│       ↓ 理论层面：操作系统的设计原理与实现机制
│
└── 【第四层：数据管理】
    └── CS561 数据库管理系统 (80%)
        • 关系模型与 SQL
        • 规范化理论
        • 事务管理 (依赖 CS520 的并发控制知识)
        • 索引与查询优化 (依赖 CS590 的数据结构与算法)
        • 存储管理 (依赖 CS520 的文件系统知识)
        ↓ 整合所有前置知识的综合应用`,
    systemLanguageCapability: {
      lowerLayerTitle: "【底层系统】",
      lowerLanguages: "C / C++",
      lowerAction: "↓ 实现",
      lowerTargets: "操作系统、数据库内核、编程语言解释器",
      lowerInfrastructure: "↓ 提供基础设施",
      upperLayerTitle: "【应用层】",
      upperLanguages: "Java / Python",
      upperAction: "↓ 开发",
      upperTargets: "Web 服务、数据分析、机器学习应用",
      coreLanguages: "Java、C、C++、Python",
      supplementMethod:
        "其他不熟悉的编程语言，通过 Claude + Cursor 快速补足。扎实的架构基础让我能判断 AI 生成代码的质量和适用性。",
    },
    systemCapabilities: [
      {
        title: "插件开发能力",
        items: ["NUKE 插件开发经验", "理解软件架构与 API", "系统级调用与集成"],
      },
      {
        title: "性能优化",
        items: ["渲染流程性能分析", "内存管理与优化", "并行计算应用"],
      },
      {
        title: "工作流程设计",
        items: ["端到端流程架构", "跨软件协作方案", "自动化系统设计"],
      },
    ],
    systemApplications: [
      "NUKE/MP 插件开发（已投入使用）",
      "跨平台工具开发经验",
      "复杂项目的系统架构设计",
      "数据库设计与管理能力",
    ],
    systemProjects: [
      {
        title: "项目一：ComfyUI 影视场景搭建工作流",
        subtitle: "技术栈：Python, PyTorch, OpenCV, NUKE API, Gaussian Splatting",
        status: "已在生产环境使用",
        summary: "功能：焦距自动化识别、3D 高斯泼溅重建、自动化投射、智能拼接、AI 辅助修复",
        techStack: ["Python", "PyTorch", "OpenCV", "NUKE API", "Gaussian Splatting"],
        highlights: ["应用高斯泼溅技术实现场景的三维重建，提升投射精度和渲染质量"],
        outcomes: ["优化渲染流程，已在生产环境使用"],
      },
      {
        title: "项目二：Drinking Time — AI 驱动的影视视觉开发平台",
        subtitle: "定位：服务影视视觉开发与 AI 生成流程的创作平台",
        status: "正在开发中",
        summary: "核心价值：让创作者更轻松地创造出影视级别的影像，并把独特想象力转化成工业级、可交付的作品",
        techStack: ["LLM API", "Prompt Engineering", "ComfyUI", "Stable Diffusion", "Full-stack"],
        architecture: [
          {
            title: "Analysis Engine（分析引擎）",
            description: "将参考图、剧本、分镜、brief 等非结构化素材转化为可复用的影视环境模板和结构化 prompt",
          },
          {
            title: "Creation Engine（创作引擎）",
            description: "基于分析结果生成影视级图像、镜头、视频片段，支持迭代优化和版本管理",
          },
        ],
        highlights: [
          "将影视前期理解能力转化为结构化 AI 生产能力",
          "把“感觉”翻译成“可执行的视觉参数”",
          "建立可跨项目复用的影视环境模板资产库",
        ],
        openSourceNote: "完全开源项目，代码将托管在 GitHub，欢迎社区贡献与协作",
        outcomes: ["正在开发中，已完成产品架构设计与核心工作流原型"],
      },
    ],
    works: [],
    stats: [],
  },

  // ── 05 学术跨界 ──────────────────────────────────────────────────────────
  {
    id: 5,
    title: "学术跨界",
    tabLabel: "学术跨界",
    subtitle: "INTERDISCIPLINARY",
    color: "#D946A8",
    icon: "Microscope",

    homeDescription:
      "我发自内心地感受到，技术的进步可以激发出更多形式的艺术表达。所以在本科学艺术的基础上，我又修了计算机科学硕士。现在我可以用算法的严谨审视艺术创作的效率，也能用审美的直觉指导技术方案的设计。",
    skills: [],
    buttonText: "美术生的代码怎么跑的？",

    description: "",
    quote: "",
    coreStatement: "",
    educationTimeline: [
      {
        period: "2014 - 2018",
        school: "吉林动画学院",
        degree: "艺术学士 · 数字媒体艺术",
        direction: "专业方向：分镜设计、剧本创作、数字艺术",
        cultivation: "核心训练：视觉叙事、色彩理论、构图法则、影视语言；奠定基础：艺术感知力、叙事能力、审美判断",
      },
      {
        period: "2018 - 2025",
        school: "7 年行业实践",
        degree: "行业实践 · 从项目到方法论",
        direction: "技术积累：掌握完整的影视美术制作流程，建立个人技术方法论；商业能力：成立个人工作室，承接国家级与国际级项目",
        cultivation: "核心收获：项目经验、技术洞察、行业认知、商业思维",
      },
      {
        period: "2025 - 2026（在读）",
        school: "史蒂文斯理工学院",
        degree: "计算机科学硕士 · 预计 2026 年 8 月毕业",
        direction: "研究方向：算法、人工智能、机器学习、计算机图形学；核心课程：机器学习（88%）、深度学习（76%）、自然语言处理（72%）、操作系统、数据库系统",
        cultivation: "能力培养：系统思维、算法设计、数学建模、工程实现",
      },
    ],
    hybridAdvantages: [
      { title: "算法美学化", description: "让 AI 生成的内容符合影视级美术标准，而非停留在“技术演示”层面；让技术产出具有艺术品质" },
      { title: "艺术工程化", description: "将传统美术流程转化为可复用、可迭代的技术系统；让艺术创作具备工程效率" },
      { title: "问题翻译能力", description: "能将艺术需求转化为技术方案，也能将技术能力转化为艺术价值" },
    ],
    uniqueValue: {
      title: "我能做什么？",
      items: [
        "与技术团队对话时，理解系统架构、算法原理、性能优化",
        "与艺术团队协作时，把握美术风格、视觉节奏、情感表达",
        "在两者之间搭建桥梁，让技术服务于艺术，让艺术驱动技术创新",
      ],
    },
    coreCompetence: "技术艺术化转化能力 · 跨领域问题解决方案 · 完整产品交付能力",
    works: [],
  },

  // ── 06 无限可能 ──────────────────────────────────────────────────────────
  {
    id: 6,
    title: "无限可能",
    tabLabel: "无限可能",
    subtitle: "",
    color: "#FFD93D",
    icon: "♾️",

    homeDescription:
      "基于左边的多项维度，我自信拥有更强大的生命力与创造力。我不希望被任何框架限制，我相信人本身的能力是无限的。",
    skills: [],
    buttonText: "下一步她想干嘛？",

    description: "",
    quote: "",
    coreStatement: "",
    futureDirections: [
      {
        title: "方向一：交叉学科研究",
        items: [
          "计算机科学 × 视觉艺术的交叉地带",
          "用算法重新定义数字艺术工作流",
          "探索生成式 AI 在影视制作中的创新应用",
          "开发连接技术与艺术的工具",
        ],
      },
      {
        title: "方向二：人类共同情感的叙述",
        items: [
          "参与触动人心的电影项目",
          "探索文物数字化等公共艺术领域",
          "服务文化记忆与情感传承",
        ],
      },
    ],
    contactInfo: [],
    works: [],
  },
];

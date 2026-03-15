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
  /** 系统能力模块（系统维度使用） */
  systemCapabilities?: { title: string; items: string[] }[];
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
    tabLabel: "Visual",
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
      {
        title: "《长安三万里》",
        placeholder: false,
        description: "全流程场景美术，营造盛唐诗意氛围",
        role: "追光动画",
        highlights: ["应用投射拼接技术，提升画面一致性"],
        tags: ["追光动画", "动画电影"],
      },
      {
        title: "《深海》",
        placeholder: false,
        description: "美术标杆镜头制作",
        role: "原力动画",
        highlights: ["压抑与希望并存的视觉表达"],
        tags: ["原力动画", "动画电影"],
      },
      {
        title: "《Kingdom》（李尸王朝）",
        placeholder: false,
        description: "国际影视项目经验",
        role: "宝琳创展",
        highlights: ["手绘技法实现 3D 难以达成的效果"],
        tags: ["宝琳创展", "Netflix"],
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
    tabLabel: "Product",
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
    stats: [
      { label: "效率提升", value: "300%" },
      { label: "制作周期缩短", value: "2/3" },
      { label: "独立产品", value: "3+" },
      { label: "团队推广使用", value: "全团队" },
    ],
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
    tabLabel: "Algorithm",
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
        items: ["线性代数", "微积分与优化", "概率论", "回归分析", "分类方法"],
        papers: [
          {
            title: "第2章：线性代数 (Linear Algebra) - 详解",
            summary:
              "线性代数是机器学习描述数据、模型和算法变换方式的语言。它把抽象的向量空间、线性映射与具体的矩阵运算连接起来，也是视觉计算、PCA、相机几何与神经网络权重理解的基础。",
            keywords: ["向量空间", "矩阵", "线性映射", "基与秩", "PCA", "相机几何"],
            sections: [
              {
                heading: "概述：机器学习的语言",
                paragraphs: [
                  "线性代数是描述数据、模型和算法运行方式的语言。数据点通常表示为向量，数据集表示为矩阵，而模型学习过程中的转换和优化则通过线性变换和矩阵运算来完成。",
                  "如果把机器学习看成一套可计算的影像生产系统，那么线性代数就是这套系统最底层的表达方式：它决定了特征如何组织、变换如何发生、信息如何在不同空间之间流动。",
                ],
              },
              {
                heading: "抽象层面与坐标层面",
                paragraphs: [
                  "理解线性代数时，可以同时从抽象层面和坐标层面进入。抽象层面关注线性映射 Φ: V -> W，帮助我们抓住几何意义和数学本质；坐标层面则把映射落到矩阵 A: R^n -> R^m 上，让计算和编程真正发生。",
                  "这两层不是彼此割裂的。抽象层面告诉我们问题真正是什么，坐标层面则给出可执行的表示形式。机器学习中的大多数工程实现，都是在这两层之间来回切换。",
                ],
                bullets: [
                  "抽象层面：概念清晰、结构优雅，但难以直接计算。",
                  "坐标层面：矩阵乘法可直接实现，是训练、推理和工程部署中的主要形式。",
                  "矩阵表示依赖于基的选择；同一个线性映射，在不同基下会对应不同的矩阵。",
                ],
              },
              {
                heading: "交换图与机器学习中的意义",
                paragraphs: [
                  "从向量空间 V 到 W 有两条等价路径：一条是直接使用抽象线性映射 Φ，另一条是先把向量写成某组基下的坐标，再通过矩阵 A 做变换，最后回到目标空间。这两条路径得到相同结果，揭示了线性映射、矩阵和基之间的深层联系。",
                  "对机器学习来说，这个关系非常关键。神经网络中的权重矩阵 W，是抽象特征映射的具体实现；PCA 中的特征向量矩阵，是投影变换的坐标表示；理解这层关系，才能真正理解算法为什么这样工作。",
                ],
                bullets: [
                  "S 和 T 表示源空间与目标空间，或者两个不同的坐标系统。",
                  "B̃ 和 C̃ 表示在不同基下的坐标表示，本质上对应 R^n 与 R^m 中的可计算形式。",
                  "Φ_CB 或 Ã_Φ 表示从基 B 到基 C 的矩阵表示，是实际计算中真正使用的对象。",
                ],
                image: {
                  src: "https://cdn.gooo.ai/web-images/1bb4d258784bd084c322fa525c4b1c5f4baa999d91a7b3b0f7e643fbbc5d5a56",
                  alt: "线性映射、基变换与矩阵表示之间的交换图",
                  caption: "交换图展示了抽象线性映射与具体矩阵表示之间的一致性。",
                },
              },
              {
                heading: "核心概念：向量与向量空间",
                paragraphs: [
                  "向量是机器学习中的基本数据单元，可以表示样本特征、模型参数、位置、方向和状态。几何上它有方向和大小，代数上它是一组有序数字。",
                  "向量空间则是所有可能向量的集合，并满足加法和标量乘法的封闭性。它提供了理解数据分布、模型假设和特征组织方式的理论背景。",
                ],
                bullets: [
                  "数据表征：样本、权重、嵌入向量都可以视为向量空间中的元素。",
                  "空间视角：理解“数据落在哪里”，往往比只看单个数值更重要。",
                ],
              },
              {
                heading: "核心概念：矩阵与矩阵运算",
                paragraphs: [
                  "矩阵是数据集最常见的表示形式，行通常代表样本，列代表特征。矩阵加法与标量乘法对应数据缩放、偏移等基础预处理，而矩阵乘法则是线性变换、内积计算、神经网络层与相机几何中的核心操作。",
                  "矩阵乘法的维度要求是前一个矩阵的列数等于后一个矩阵的行数，结果矩阵中的元素 c_ij 由第 i 行和第 j 列逐项相乘再求和得到。单位矩阵在乘法中扮演“1”的角色，转置常用于内积和协方差构建，逆矩阵则帮助我们理解线性系统 Ax = b 的可解性与可逆性。",
                ],
                bullets: [
                  "结合律成立：(AB)C = A(BC)，这让多层矩阵连乘可以按更高效的顺序计算。",
                  "分配律成立：(A+B)C = AC+BC，A(C+D) = AC+AD。",
                  "2x2 矩阵可逆的关键条件是 det(A) != 0；可逆矩阵也称 regular / invertible，不可逆矩阵称 singular。",
                  "矩阵乘法的几何意义，是把向量 x 通过线性变换 Φ 映射到新的向量 y。",
                ],
              },
              {
                heading: "核心概念：线性映射、基、维度与秩",
                paragraphs: [
                  "线性映射是把一个向量空间中的向量映射到另一个向量空间的规则。在线性回归、PCA、卷积核、注意力投影等场景中，本质上都可以看成线性变换的不同组织方式。",
                  "基是连接抽象空间和可计算表示的桥梁。选择一组线性无关的基向量后，任何向量都能被唯一表示；同一个抽象映射选择不同的基，会得到不同的矩阵表示。维度等于基向量数量，秩则表示矩阵中线性独立列或行的最大数量，反映了有效信息量与变换能力。",
                ],
                bullets: [
                  "改变基，本质上就是改变坐标系统；同一个问题可以因此得到不同但等价的矩阵表达。",
                  "满秩意味着没有冗余信息，秩不足往往对应信息坍缩、依赖关系或不可逆问题。",
                  "降维方法如 PCA，目标就是找到更有效的低维基，用更少的维度保留更多信息。",
                ],
              },
              {
                heading: "关键应用",
                paragraphs: [
                  "线性代数不是只停留在教材里的基础课，它直接支撑了影视视觉开发、机器学习训练和图像生成中的大量关键环节。",
                ],
                bullets: [
                  "数据表示：把原始数据转成向量和矩阵，进入后续算法管线。",
                  "特征工程：通过线性变换构造更有效的特征表示。",
                  "模型参数：权重和偏置通常组织成向量或矩阵。",
                  "降维与压缩：PCA、SVD 等方法帮助减少维度并保留主要结构。",
                  "求解线性系统：优化问题、相机估计、几何对齐中经常需要求解 Ax = b。",
                  "图像处理：图像本身就是矩阵，许多滤波、投影、匹配与重建过程都依赖矩阵运算。",
                ],
              },
              {
                heading: "学习资源",
                paragraphs: [
                  "学习线性代数时，最有效的方式不是只背定义，而是把理论、可视化与代码实现放在一起理解。几何直觉越稳，后续机器学习和视觉算法越容易真正吃透。",
                ],
                bullets: [
                  "理论与实践结合：建议配合 Python / Numpy 自己实现向量、矩阵与变换操作。",
                  "可视化理解：2D/3D 向量和线性变换尽量画出来看，几何直觉会明显更扎实。",
                  "多做习题：把公式、定义和应用真正做通，才能在项目里用得稳。",
                ],
                links: [
                  {
                    label: "《Mathematics for Machine Learning》第 2 章习题",
                    href: "https://github.com/ilmoi/MML-Book/blob/master/end%20of%20chapter%20exercises/Chapter%202%20Exercises%20-%20PDF.pdf",
                  },
                  {
                    label: "MIT OpenCourseWare - Linear Algebra (Gilbert Strang)",
                    href: "https://www.youtube.com/playlist?list=PL49CF3715CB9EF31D",
                  },
                  {
                    label: "3Blue1Brown《线性代数的本质》系列",
                    href: "https://www.3blue1brown.com/topics/linear-algebra",
                  },
                ],
              },
            ],
          },
          {
            title: "微积分与优化长论文",
            summary: "用于梳理导数、偏导、链式法则与优化理论在训练与控制中的意义。",
            keywords: ["导数", "梯度", "链式法则", "优化"],
            sections: [
              {
                heading: "论文定位",
                paragraphs: [
                  "这一篇适合放你对微积分与优化方法的完整长文说明，尤其是梯度如何驱动模型更新。",
                ],
              },
              {
                heading: "建议补入的重点",
                paragraphs: [
                  "可重点写损失函数曲面、局部最优、学习率、收敛性，以及为什么优化过程会影响生成稳定性。",
                ],
              },
            ],
          },
          {
            title: "概率论长论文",
            summary: "用于解释随机变量、分布、条件概率与贝叶斯直觉在 AI 生成与推断中的作用。",
            keywords: ["概率分布", "条件概率", "随机变量", "贝叶斯"],
            sections: [
              {
                heading: "论文定位",
                paragraphs: [
                  "这里可以插入你关于概率论如何支撑不确定性建模与生成过程的完整论文正文。",
                ],
              },
              {
                heading: "建议补入的重点",
                paragraphs: [
                  "建议写清：分布假设、采样、噪声、后验估计，以及它们和扩散模型、生成质量的关系。",
                ],
              },
            ],
          },
          {
            title: "回归分析长论文",
            summary: "用于讲清回归问题如何从连续值预测延伸到参数估计与趋势建模。",
            keywords: ["线性回归", "残差", "拟合", "参数估计"],
            sections: [
              {
                heading: "论文定位",
                paragraphs: [
                  "这里适合插入你关于回归分析的长篇内容，包括模型假设、误差分析和参数解释。",
                ],
              },
              {
                heading: "与项目的关系",
                paragraphs: [
                  "建议补充它如何帮助你理解连续变量控制，例如焦距估计、色彩偏移和空间参数拟合。",
                ],
              },
            ],
          },
          {
            title: "分类方法长论文",
            summary: "用于整理判别边界、特征空间与分类模型在视觉识别中的作用。",
            keywords: ["分类器", "决策边界", "特征空间", "监督学习"],
            sections: [
              {
                heading: "论文定位",
                paragraphs: [
                  "这里可以放你对分类方法的系统长文，包括二分类、多分类与特征决策逻辑。",
                ],
              },
              {
                heading: "建议补入的重点",
                paragraphs: [
                  "建议补充：逻辑回归、SVM、树模型或神经网络分类头如何为视觉理解与标注提供支持。",
                ],
              },
            ],
          },
        ],
      },
      {
        level: "机器学习原理",
        items: ["梯度下降", "损失函数", "正则化"],
        papers: [
          {
            title: "梯度下降长论文",
            summary: "用于系统梳理 SGD、Momentum、Adam 等优化策略的原理与差异。",
            keywords: ["SGD", "Adam", "优化器", "收敛"],
            sections: [
              {
                heading: "论文定位",
                paragraphs: [
                  "这里可以插入你对梯度下降家族算法的完整长文，包括数学推导与工程含义。",
                ],
              },
              {
                heading: "建议补入的重点",
                paragraphs: [
                  "可重点写：学习率、振荡、收敛速度、泛化影响，以及为什么不同优化器会影响训练结果。",
                ],
              },
            ],
          },
          {
            title: "损失函数长论文",
            summary: "用于说明损失函数如何定义模型目标，以及它如何影响最终生成与识别效果。",
            keywords: ["Loss", "目标函数", "优化目标"],
            sections: [
              {
                heading: "论文定位",
                paragraphs: [
                  "这一篇适合写清不同损失函数如何塑造模型学习方向和误差惩罚方式。",
                ],
              },
              {
                heading: "建议补入的重点",
                paragraphs: [
                  "建议补充分类损失、回归损失、感知损失以及它们在图像任务中的差异。",
                ],
              },
            ],
          },
          {
            title: "正则化长论文",
            summary: "用于解释模型复杂度控制、过拟合抑制与泛化能力之间的关系。",
            keywords: ["L1", "L2", "Dropout", "泛化"],
            sections: [
              {
                heading: "论文定位",
                paragraphs: [
                  "这里可以放你对正则化方法的完整长文，包括参数约束与结构约束的理解。",
                ],
              },
              {
                heading: "建议补入的重点",
                paragraphs: [
                  "建议写清：为什么正则化不仅是防过拟合手段，也是在控制模型可解释性和稳定性。",
                ],
              },
            ],
          },
        ],
      },
      {
        level: "深度学习架构",
        items: ["CNN", "Transformer", "扩散模型"],
        papers: [
          {
            title: "CNN 长论文",
            summary: "用于说明卷积结构如何处理局部特征、层级表征和空间模式。",
            keywords: ["卷积", "感受野", "特征图", "ResNet"],
            sections: [
              {
                heading: "论文定位",
                paragraphs: [
                  "这里可以插入你关于 CNN 从基础卷积到现代架构演进的长文梳理。",
                ],
              },
              {
                heading: "建议补入的重点",
                paragraphs: [
                  "可重点写：卷积核、池化、残差连接，以及为什么 CNN 仍然是视觉任务的重要底座。",
                ],
              },
            ],
          },
          {
            title: "Transformer 长论文",
            summary: "用于梳理注意力机制如何改变序列建模，并进一步影响视觉与多模态架构。",
            keywords: ["Attention", "Self-Attention", "多头注意力"],
            sections: [
              {
                heading: "论文定位",
                paragraphs: [
                  "这里适合放你对 Transformer 数学结构、注意力计算和架构优势的完整长文。",
                ],
              },
              {
                heading: "建议补入的重点",
                paragraphs: [
                  "建议写清它为什么从 NLP 扩展到了视觉、视频和多模态模型。",
                ],
              },
            ],
          },
          {
            title: "扩散模型长论文",
            summary: "用于说明噪声注入、反向去噪与条件控制如何支撑生成式图像系统。",
            keywords: ["Diffusion", "去噪", "采样", "Stable Diffusion"],
            sections: [
              {
                heading: "论文定位",
                paragraphs: [
                  "这里可以插入你关于扩散模型原理与生成流程的完整长文版本。",
                ],
              },
              {
                heading: "建议补入的重点",
                paragraphs: [
                  "建议重点写：噪声调度、条件控制、采样速度、画面质量以及在影视视觉开发中的适配方式。",
                ],
              },
            ],
          },
        ],
      },
      {
        level: "具体应用",
        items: ["图像生成", "NLP", "计算机视觉"],
      },
    ],
    algorithmCourseDetails: [
      {
        title: "机器学习",
        code: "CS586",
        depth: "深度 88%",
        summary: "建立从经典监督学习到完整训练管线的数学直觉和实现能力。",
        topics: [
          "线性回归、逻辑回归的数学推导与实现",
          "梯度下降算法的优化策略（SGD、Adam、RMSprop）",
          "正则化技术（L1 / L2）在过拟合控制中的应用",
        ],
        practice: "实战：从零实现完整的机器学习管线",
      },
      {
        title: "深度学习",
        code: "CS583",
        depth: "深度 76% · 8 月完成",
        summary: "从神经网络推导进入视觉模型架构理解，为后续生成式工作流和视觉控制打基础。",
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
        summary: "把文本理解能力转向影视 brief、剧本片段和 LLM 驱动的生成控制。",
        topics: [
          "词嵌入技术（Word2Vec、GloVe）",
          "语言模型的演进：从 RNN 到 GPT",
          "Transformer 在 NLP 中的应用",
        ],
        practice: "实战：构建基于 LLM 的对话系统，并应用于 AI 社交产品",
      },
    ],
    algorithmApplicationAreas: [
      {
        title: "计算机视觉（CV）",
        subtitle: "AI 美术",
        description: "将 AI 技术融入影视美术工作流，让算法真正服务于画面生产。",
        clusters: [
          {
            title: "图像处理算法",
            items: [
              "图像分割、边缘检测在 Matte Painting 中的应用",
              "色彩空间转换与色彩匹配算法",
              "基于深度学习的图像超分辨率",
            ],
          },
        ],
      },
      {
        title: "工作流重构",
        subtitle: "MP Pipeline",
        description: "让传统数字绘景与生成式工具在同一条生产线上协同工作。",
        clusters: [
          {
            title: "重构 MP 工作流程",
            items: [
              "使用 ControlNet 实现精确的构图控制",
              "结合传统绘景与 AI 生成的混合工作流",
              "自动化投射拼接技术的算法优化",
            ],
          },
        ],
      },
      {
        title: "插件底层实现",
        subtitle: "Tooling",
        description: "把图像算法嵌入现有生产工具，减少重复劳动和手工成本。",
        clusters: [
          {
            title: "插件实现与优化",
            items: [
              "NUKE 插件中的图像处理算法集成",
              "OpenCV 与 NUKE API 的结合应用",
              "实时预览的性能优化策略",
            ],
          },
        ],
      },
      {
        title: "持续学习",
        subtitle: "Research Frontier",
        description: "保持对前沿模型和社区生态的追踪，让方法论持续进化。",
        clusters: [
          {
            title: "研究与实验",
            items: [
              "关注最新的 AI 论文（arXiv）",
              "参与开源项目贡献（GitHub）",
              "实验前沿技术（SORA、Runway Gen-3）",
            ],
          },
        ],
      },
    ],
    algorithmProjects: [
      {
        title: "ComfyUI 影视场景搭建工作流",
        subtitle: "生产环境中的场景分析与搭建系统",
        status: "已在生产环境使用",
        summary: "围绕影视场景制作搭建可复用工作流，将焦距识别、三维重建、自动化投射和智能修复整合进一条可落地的生产链。",
        techStack: ["Python", "PyTorch", "OpenCV", "NUKE API", "Gaussian Splatting"],
        features: [
          "焦距自动化识别",
          "3D 高斯泼溅重建",
          "自动化投射",
          "智能拼接",
          "AI 辅助修复",
        ],
        highlights: [
          "应用高斯泼溅技术实现场景的三维重建，提升投射精度和渲染质量",
          "将传统 MP 手工步骤改写成可重复的节点化工作流",
        ],
        outcomes: ["优化渲染流程", "降低手工反复校准成本", "已在真实生产环境使用"],
      },
      {
        title: "Drinking Time",
        subtitle: "AI 驱动的影视视觉开发平台",
        status: "正在开发中",
        summary: "服务影视视觉开发与 AI 生成流程的创作平台，目标是让创作者把独特想象力转化为工业级、可交付的影视影像。",
        techStack: ["LLM API", "Prompt Engineering", "ComfyUI", "Stable Diffusion", "Full-stack"],
        architecture: [
          {
            title: "Analysis Engine",
            description: "将参考图、剧本、分镜、brief 等非结构化素材转化为可复用的影视环境模板和结构化 prompt。",
          },
          {
            title: "Creation Engine",
            description: "基于分析结果生成影视级图像、镜头、视频片段，支持迭代优化和版本管理。",
          },
        ],
        highlights: [
          "将影视前期理解能力转化为结构化 AI 生产能力",
          "把“感觉”翻译成“可执行的视觉参数”",
          "建立可跨项目复用的影视环境模板资产库",
        ],
        outcomes: ["已完成产品架构设计", "已完成核心工作流原型"],
        openSourceNote: "完全开源项目，代码将托管在 GitHub，欢迎社区贡献与协作。",
      },
    ],
    works: [],
  },

  // ── 04 系统 ──────────────────────────────────────────────────────────────
  {
    id: 4,
    title: "系统",
    tabLabel: "System",
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
    systemCourses: [
      { code: "CS525", name: "系统编程" },
      { code: "CS520", name: "操作系统概论" },
      { code: "CS561", name: "数据库管理系统" },
    ],
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
    works: [],
    stats: [
      { label: "系统架构", value: "复杂项目设计" },
      { label: "数据库", value: "设计与管理" },
    ],
  },

  // ── 05 学术跨界 ──────────────────────────────────────────────────────────
  {
    id: 5,
    title: "学术跨界",
    tabLabel: "Interdisciplinary",
    subtitle: "INTERDISCIPLINARY",
    color: "#D946A8",
    icon: "Microscope",

    homeDescription:
      "我发自内心地感受到，技术的进步可以激发出更多形式的艺术表达。所以在本科学艺术的基础上，我又修了计算机科学硕士。现在我可以用算法的严谨审视艺术创作的效率，也能用审美的直觉指导技术方案的设计。",
    skills: [],
    buttonText: "美术生的代码怎么跑的？",

    description: "",
    quote: "最有趣的事情发生在边界。",
    coreStatement: "",
    educationTimeline: [
      {
        period: "2014 - 2018",
        school: "吉林动画学院",
        degree: "艺术学士",
        direction: "分镜、剧本创作、数字艺术",
        cultivation: "艺术感知力、叙事能力、审美判断",
      },
      {
        period: "2018 - 2025",
        school: "7 年行业实践",
        degree: "从实拍到动画",
        direction: "从执行者到标准制定者",
        cultivation: "项目经验、技术洞察、行业认知",
      },
      {
        period: "2025 - 2026（在读）",
        school: "史蒂文斯理工学院",
        degree: "计算机科学硕士",
        direction: "算法、AI、机器学习、图形学",
        cultivation: "系统思维、数学功底、研究能力",
      },
    ],
    hybridAdvantages: [
      { title: "算法美学化", description: "让技术产出具有艺术品质" },
      { title: "艺术工程化", description: "让艺术创作具备工程效率" },
    ],
    works: [],
  },

  // ── 06 无限可能 ──────────────────────────────────────────────────────────
  {
    id: 6,
    title: "无限可能",
    tabLabel: "Future",
    subtitle: "FUTURE",
    color: "#FFD93D",
    icon: "♾️",

    homeDescription:
      "基于左边的多项维度，我自信拥有更强大的生命力与创造力。我不希望被任何框架限制，我相信人本身的能力是无限的。",
    skills: ["持续学习", "前沿探索", "创意实验", "无限进化"],
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

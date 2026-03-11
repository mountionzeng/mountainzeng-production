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

/** 课程条目（算法维度使用） */
export interface CourseItem {
  code: string;
  name: string;
  category: string;
}

/** 数学作业条目（算法维度使用） */
export interface MathAssignmentItem {
  subject: string;
  previewImage: string;
  pdfFile: string;
  note?: string;
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
  knowledgeChain?: { level: string; items: string[] }[];
  /** 技术应用方向（算法维度使用） */
  techApplications?: { title: string; items: string[] }[];
  /** 编程语言掌握情况（算法维度使用） */
  courses?: CourseItem[];
  /** 数学基础作业（算法维度使用） */
  mathAssignments?: MathAssignmentItem[];
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
    skills: ["深度学习", "计算机视觉", "模型优化", "AI应用"],
    buttonText: "👀Xiangyu的数学作业～",

    description:
      "数学教会我的不只是计算，而是一种严谨的思维方式：如何抽象问题、如何寻找模式、如何在复杂度与效率之间找到平衡。",
    quote: "我懂 AI 的数学本质，不只是调用 API。",
    coreStatement: "理解智能本质",
    knowledgeChain: [
      { level: "数学基础", items: ["线性代数", "概率论", "优化理论"] },
      { level: "机器学习原理", items: ["梯度下降", "损失函数", "正则化"] },
      { level: "深度学习架构", items: ["CNN", "Transformer", "扩散模型"] },
      { level: "具体应用", items: ["图像生成", "NLP", "计算机视觉"] },
    ],
    techApplications: [
      {
        title: "计算机视觉（CV）—— AI 美术",
        items: ["图像处理算法", "重构 MP 工作流程", "插件底层实现"],
      },
      {
        title: "计算机图形学（CG）—— 传统电脑美术",
        items: ["实时渲染管线理解与应用", "着色器编程（Shader）", "3D 图形管线与视觉特效"],
      },
      {
        title: "AI 工具精通",
        items: ["Midjourney 高级应用", "ComfyUI 工作流设计", "AI 生成图像的后期优化"],
      },
    ],
    courses: [
      { code: "Python", name: "熟练", category: "编程语言" },
      { code: "C/C++", name: "熟悉", category: "编程语言" },
      { code: "Java", name: "熟悉（CS501 课程训练）", category: "编程语言" },
    ],
    mathAssignments: [
      {
        subject: "线性代数",
        previewImage: "/math-assignments/linear-algebra-assignment.webp",
        pdfFile: "/math-assignments/linear-algebra-assignment.pdf",
        note: "矩阵分解与特征值练习",
      },
      {
        subject: "概率论",
        previewImage: "/math-assignments/probability-assignment.webp",
        pdfFile: "/math-assignments/probability-assignment.pdf",
        note: "条件概率与分布推导",
      },
      {
        subject: "微积分",
        previewImage: "/math-assignments/calculus-assignment.webp",
        pdfFile: "/math-assignments/calculus-assignment.pdf",
        note: "极限、导数与积分综合题",
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

    description: "这种能力让我能做出更优的技术选型判断，确保整个架构的健壮与高效。",
    quote: "简洁的代码是最好的文档。",
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
      { label: "实际应用", value: "NUKE/MP 插件开发" },
      { label: "跨平台", value: "工具开发经验" },
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
    skills: ["技术 + 艺术", "理性 + 感性", "科学 + 人文", "创新思维"],
    buttonText: "美术生的代码怎么跑的？",

    description:
      "七年的一线项目经验让我理解技术真正要解决的问题，而不是为技术而技术。这种跨界让我能用算法的严谨性审视艺术创作的效率，也能用审美的直觉性指导技术方案的设计。",
    quote: "最有趣的事情发生在边界。",
    coreStatement: "双重视角融合",
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

    description:
      "基于左边的多项维度，我自信拥有更强大的生命力与创造力。我不希望被任何框架限制，我相信人本身的能力是无限的。",
    quote: "不要定义我，我还在生长。",
    coreStatement: "探索无限可能",
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
    contactInfo: [
      { type: "邮箱", value: "mountion@example.com", icon: "Mail" },
      { type: "GitHub", value: "github.com/mountion", icon: "Github" },
      { type: "LinkedIn", value: "linkedin.com/in/mountion", icon: "Linkedin" },
    ],
    works: [],
  },
];

/*
 * 评测场景源文件 —— 唯一真相来源
 * PROMPT_ENGINEERING.md 中"评测场景"小节的展示版本必须与本文件对齐
 * 修改本文件后，请同步刷新 md 中的表格
 */

export interface EvalScenario {
  id: string;
  description: string;
  /** 用户的首句（也可以是模拟对话中的最后一句） */
  openingLine: string;
  /** 期望模型表现，给评测者打 rubric 时参考 */
  expectation: string;
  /** 可选：前置已收集卡片数，用于模拟"第 N 张卡时"的场景 */
  cardsCollected?: number;
  /** 可选：前置对话历史。openingLine 会被追加为最后一条 user 消息 */
  priorTurns?: { role: "user" | "assistant"; content: string }[];
}

export const EVAL_SCENARIOS: EvalScenario[] = [
  {
    id: "E01",
    description: "表达克制的内向用户",
    openingLine: "我不太会聊自己…但可以试试。",
    expectation: "不要急着出卡，至少追问 1 轮，给安全感而不是逼问",
  },
  {
    id: "E02",
    description: "故事丰富、细节多的用户",
    openingLine:
      "我刚刚还在想一件事——昨晚我没睡，三点跑去厨房擦了一遍水槽。不是强迫症，是当时大脑里在跑一个 bug 的解法，手必须有事做才能让脑子空出来。",
    expectation:
      "第 1–2 轮就能出第一张卡，且 evidence 引用'擦水槽 / 手有事脑子才空'这种具体意象",
  },
  {
    id: "E03",
    description: "抗拒 / 阴阳怪气的用户",
    openingLine: "这种游戏有什么意思，反正你最后会说我'独特又敏感'吧。",
    expectation:
      "不进入说服模式，不辩解，温柔承接 ta 的不信任本身就是信号，把这种警觉提成第一个问题",
  },
  {
    id: "E04",
    description: "一句话回答的用户",
    openingLine: "还行吧。",
    expectation: "追问一个具体的人/事/时间，不评价、不下定义、不'鼓励'",
  },
  {
    id: "E05",
    description:
      "已收集 5 张卡进入第 6 张（前 5 张覆盖：思维方式 / 动力源 / 关系模式 / 价值观 / 节奏）",
    openingLine: "我感觉你已经差不多懂我了，还差一张？我可能没什么新的能说了。",
    expectation:
      "第 6 张必须转向未被触及的维度（如与世界的关系 / 与时间的关系 / 与失败的关系），不能再在已有 5 个维度上加深",
    cardsCollected: 5,
  },
];

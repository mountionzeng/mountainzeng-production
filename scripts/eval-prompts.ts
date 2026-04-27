/*
 * 提示词评测脚本
 *
 * 用法（先确保 dev server 在跑：`npm run dev` 或 `npx vite --host`）：
 *   npx tsx scripts/eval-prompts.ts            # 跑所有场景
 *   npx tsx scripts/eval-prompts.ts E03        # 只跑指定 ID
 *   npx tsx scripts/eval-prompts.ts E02 E05    # 跑多个
 *
 * 输出：
 *   server/game-language-model/eval/runs/<timestamp>.md
 *   每个场景一段：输入 + 模型流式文本 + 生成的卡片 + 空白 rubric checklist
 *
 * 用法心法：每次改完 prompt 跑一遍，跟上一次的 .md 做 diff 看变化。
 */

import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { EVAL_SCENARIOS, type EvalScenario } from "../server/game-language-model/eval/scenarios";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const ENDPOINT = process.env.GAME_API_ENDPOINT ?? "http://localhost:3000/api/game/chat";
const OUTPUT_DIR = path.join(PROJECT_ROOT, "server/game-language-model/eval/runs");

interface ScenarioResult {
  scenario: EvalScenario;
  text: string;
  cards: { name: string; description: string; evidence: string; color: string; icon: string }[];
  errors: string[];
  durationMs: number;
}

async function runScenario(scenario: EvalScenario): Promise<ScenarioResult> {
  const messages = [
    ...(scenario.priorTurns ?? []),
    { role: "user" as const, content: scenario.openingLine },
  ];
  const body = {
    messages,
    cardsCollected: scenario.cardsCollected ?? 0,
  };

  const start = Date.now();
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => "");
    return {
      scenario,
      text: "",
      cards: [],
      errors: [`HTTP ${res.status}: ${errText.slice(0, 300)}`],
      durationMs: Date.now() - start,
    };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  const cards: ScenarioResult["cards"] = [];
  const errors: string[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const raw = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const dataLine = raw.split("\n").find((l) => l.startsWith("data:"));
      if (!dataLine) continue;
      const json = dataLine.slice(5).trim();
      if (!json) continue;
      try {
        const ev = JSON.parse(json);
        if (ev.type === "text_delta") text += ev.delta;
        else if (ev.type === "card") cards.push(ev.card);
        else if (ev.type === "error") errors.push(ev.message);
      } catch {
        // ignore parse errors mid-stream
      }
    }
  }

  return { scenario, text, cards, errors, durationMs: Date.now() - start };
}

function renderResult(result: ScenarioResult): string {
  const { scenario, text, cards, errors, durationMs } = result;
  const lines: string[] = [];

  lines.push(`## ${scenario.id} · ${scenario.description}`);
  lines.push("");
  lines.push(`> 期望：${scenario.expectation}`);
  if (scenario.cardsCollected) {
    lines.push(`> 前置：已收集 ${scenario.cardsCollected} 张卡`);
  }
  lines.push("");

  lines.push("### 输入");
  if (scenario.priorTurns?.length) {
    lines.push("```");
    for (const t of scenario.priorTurns) {
      lines.push(`${t.role === "user" ? "USER" : "ASSISTANT"}: ${t.content}`);
    }
    lines.push("```");
  }
  lines.push("```");
  lines.push(`USER: ${scenario.openingLine}`);
  lines.push("```");
  lines.push("");

  lines.push(`### 模型回复 _(${(durationMs / 1000).toFixed(1)}s)_`);
  lines.push("");
  lines.push(text || "_(无文本输出)_");
  lines.push("");

  if (cards.length > 0) {
    lines.push("### 生成的卡片");
    for (const card of cards) {
      lines.push("```json");
      lines.push(JSON.stringify(card, null, 2));
      lines.push("```");
    }
    lines.push("");
  } else {
    lines.push("### 生成的卡片");
    lines.push("_(本回合未出卡)_");
    lines.push("");
  }

  if (errors.length > 0) {
    lines.push("### ⚠️ 错误");
    for (const e of errors) lines.push(`- ${e}`);
    lines.push("");
  }

  lines.push("### 评分");
  lines.push("**对话风格 Rubric**");
  lines.push("- [ ] 一次只问一个问题");
  lines.push("- [ ] 指向具体场景，不让用户自评");
  lines.push("- [ ] 没有黑话 / 心理学术语");
  lines.push("- [ ] 回答太短时温柔追问，不急着出卡");
  lines.push("");
  if (cards.length > 0) {
    lines.push("**卡片质量 Rubric**（每张卡都过一遍）");
    lines.push("- [ ] 独特性：换个人来玩，不会拿到几乎一样的卡");
    lines.push("- [ ] 取证：evidence 引用了对话中的具体话语/意象");
    lines.push("- [ ] 称号感：name 像角色/隐喻，不是平铺形容词");
    lines.push("- [ ] 第二人称冲击力：description 30–60 字，读完心里'对'");
    lines.push("- [ ] 不与已有卡重复（多张时）");
    lines.push("");
  }
  lines.push("**针对场景的特定期望是否满足？**");
  lines.push(`- [ ] ${scenario.expectation}`);
  lines.push("");
  lines.push("**附加观察 / 改 prompt 的线索**：");
  lines.push("> ");
  lines.push("");
  lines.push("---");
  lines.push("");

  return lines.join("\n");
}

async function main() {
  const args = process.argv.slice(2);
  const filter = args.length > 0 ? new Set(args.map((a) => a.toUpperCase())) : null;
  const scenarios = filter
    ? EVAL_SCENARIOS.filter((s) => filter.has(s.id.toUpperCase()))
    : EVAL_SCENARIOS;

  if (scenarios.length === 0) {
    console.error(`No scenarios match: ${args.join(", ")}`);
    console.error(`Available: ${EVAL_SCENARIOS.map((s) => s.id).join(", ")}`);
    process.exit(1);
  }

  console.log(`▶ 端点：${ENDPOINT}`);
  console.log(`▶ 跑 ${scenarios.length} 个场景：${scenarios.map((s) => s.id).join(", ")}`);
  console.log("");

  // 中文注释：连通性预检 —— 一开始就报错好过等到 fetch 之后
  try {
    const ping = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "ping" }] }),
    });
    if (ping.status === 0) throw new Error("no response");
    // 不消费 body，节流
    ping.body?.cancel().catch(() => undefined);
  } catch (err) {
    console.error(`✗ 无法连接到 ${ENDPOINT}`);
    console.error(`  ${(err as Error).message}`);
    console.error(`  请先启动 dev server：npm run dev`);
    process.exit(1);
  }

  const results: ScenarioResult[] = [];
  for (const sc of scenarios) {
    process.stdout.write(`  ${sc.id} ${sc.description}... `);
    try {
      const r = await runScenario(sc);
      results.push(r);
      const cardCount = r.cards.length;
      const status = r.errors.length > 0 ? "⚠️" : cardCount > 0 ? `✓ +${cardCount} card` : "✓";
      console.log(`${status} (${(r.durationMs / 1000).toFixed(1)}s)`);
    } catch (err) {
      console.log(`✗ ${(err as Error).message}`);
      results.push({
        scenario: sc,
        text: "",
        cards: [],
        errors: [(err as Error).message],
        durationMs: 0,
      });
    }
  }

  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outFile = path.join(OUTPUT_DIR, `${stamp}.md`);

  const header = [
    `# 评测运行 · ${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}`,
    "",
    `- 端点：\`${ENDPOINT}\``,
    `- 场景：${scenarios.map((s) => s.id).join(", ")}`,
    `- 模型：由服务端 \`ANTHROPIC_MODEL\` 决定（默认 claude-sonnet-4-6）`,
    "",
    "对照 [PROMPT_ENGINEERING.md](../../prompts/PROMPT_ENGINEERING.md) 中的 Rubric 逐项打分。",
    "",
    "---",
    "",
  ].join("\n");

  const body = results.map(renderResult).join("\n");
  writeFileSync(outFile, header + body, "utf-8");

  console.log("");
  console.log(`✓ 报告已写入：${path.relative(PROJECT_ROOT, outFile)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

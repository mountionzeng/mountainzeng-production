#!/usr/bin/env node

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import process from "node:process";

const DEFAULT_CONFIG_PATH = "scripts/docs-translation.config.json";
const DEFAULT_MODEL_OPENAI = "gpt-4.1-mini";
const DEFAULT_MODEL_DASHSCOPE = "qwen-plus-latest";
const DEFAULT_MAX_CHARS = 6000;

function parseArgs(argv) {
  const args = {
    config: DEFAULT_CONFIG_PATH,
    source: null,
    target: null,
    provider: null,
    model: null,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--config" && argv[i + 1]) {
      args.config = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === "--source" && argv[i + 1]) {
      args.source = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === "--target" && argv[i + 1]) {
      args.target = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === "--provider" && argv[i + 1]) {
      args.provider = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === "--model" && argv[i + 1]) {
      args.model = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === "--dry-run") {
      args.dryRun = true;
    }
  }

  return args;
}

async function fileExists(filePath) {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function loadEnvFromFile(filePath) {
  const content = await readFile(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

async function loadLocalEnv() {
  const root = process.cwd();
  const envCandidates = [".env.local", ".env"];
  for (const name of envCandidates) {
    const fullPath = path.resolve(root, name);
    if (await fileExists(fullPath)) {
      await loadEnvFromFile(fullPath);
    }
  }
}

function inferTargetPath(sourcePath) {
  const parsed = path.parse(sourcePath);
  return path.join(parsed.dir, `${parsed.name}.en${parsed.ext || ".md"}`);
}

async function loadTasks(args) {
  if (args.source) {
    return [
      {
        source: args.source,
        target: args.target ?? inferTargetPath(args.source),
      },
    ];
  }

  const configPath = path.resolve(process.cwd(), args.config);
  const exists = await fileExists(configPath);
  if (!exists) {
    throw new Error(`配置文件不存在: ${configPath}`);
  }

  const configRaw = await readFile(configPath, "utf8");
  const config = JSON.parse(configRaw);
  const tasks = Array.isArray(config.tasks) ? config.tasks : [];
  if (tasks.length === 0) {
    throw new Error(`配置文件没有任务: ${configPath}`);
  }

  return tasks.map((task) => {
    if (!task.source) {
      throw new Error(`任务缺少 source: ${JSON.stringify(task)}`);
    }
    return {
      source: task.source,
      target: task.target ?? inferTargetPath(task.source),
    };
  });
}

function splitMarkdownIntoChunks(markdown, maxChars) {
  const lines = markdown.split(/\r?\n/);
  const chunks = [];
  let current = [];
  let currentLen = 0;
  let inCodeFence = false;

  const pushCurrent = () => {
    if (current.length === 0) return;
    chunks.push(current.join("\n"));
    current = [];
    currentLen = 0;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      inCodeFence = !inCodeFence;
    }

    const nextLen = currentLen + line.length + 1;
    if (!inCodeFence && currentLen > 0 && nextLen > maxChars) {
      pushCurrent();
    }

    current.push(line);
    currentLen += line.length + 1;
  }

  pushCurrent();
  return chunks;
}

function buildTranslationPrompt(chunk, index, total) {
  return `You are translating technical markdown from Simplified Chinese to professional English.

Hard constraints:
1) Preserve markdown structure exactly (headings, lists, tables, blockquotes, links).
2) Do not translate code blocks, inline code identifiers, URLs, file paths, CLI commands.
3) Keep numbers, dates, percentages, and course codes unchanged.
4) Keep original paragraph order.
5) Return only translated markdown, with no explanation.

Chunk ${index + 1}/${total}:

${chunk}`;
}

async function translateWithOpenAI({ apiKey, model, prompt }) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      input: [
        {
          role: "user",
          content: [{ type: "input_text", text: prompt }],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI 翻译失败: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const textFromOutput =
    data.output
      ?.flatMap((item) => item.content ?? [])
      ?.filter((part) => part.type === "output_text" && typeof part.text === "string")
      ?.map((part) => part.text)
      ?.join("\n") ?? "";

  if (!textFromOutput.trim()) {
    throw new Error("OpenAI 返回内容为空，无法生成英文文档。");
  }

  return textFromOutput.trim();
}

async function translateWithDashScope({ apiKey, model, prompt }) {
  const response = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DashScope 翻译失败: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("DashScope 返回内容为空，无法生成英文文档。");
  }
  return content.trim();
}

function createTranslator(args) {
  const provider =
    args.provider ||
    process.env.DOCS_TRANSLATE_PROVIDER ||
    (process.env.OPENAI_API_KEY ? "openai" : process.env.DASHSCOPE_API_KEY ? "dashscope" : null);

  if (!provider) {
    throw new Error(
      "未检测到翻译提供方。请在 .env 中配置 DOCS_TRANSLATE_PROVIDER=openai|dashscope，并提供对应 API Key。"
    );
  }

  if (provider === "openai") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("DOCS_TRANSLATE_PROVIDER=openai，但未配置 OPENAI_API_KEY。");
    }
    const model = args.model || process.env.DOCS_TRANSLATE_MODEL || DEFAULT_MODEL_OPENAI;
    return async (prompt) => translateWithOpenAI({ apiKey, model, prompt });
  }

  if (provider === "dashscope") {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      throw new Error("DOCS_TRANSLATE_PROVIDER=dashscope，但未配置 DASHSCOPE_API_KEY。");
    }
    const model = args.model || process.env.DOCS_TRANSLATE_MODEL || DEFAULT_MODEL_DASHSCOPE;
    return async (prompt) => translateWithDashScope({ apiKey, model, prompt });
  }

  throw new Error(`不支持的翻译提供方: ${provider}`);
}

async function translateMarkdown(markdown, translatePrompt) {
  const maxCharsRaw = process.env.DOCS_TRANSLATE_MAX_CHARS;
  const maxChars = Number(maxCharsRaw) > 1000 ? Number(maxCharsRaw) : DEFAULT_MAX_CHARS;
  const chunks = splitMarkdownIntoChunks(markdown, maxChars);
  const translated = [];

  for (let i = 0; i < chunks.length; i += 1) {
    const prompt = buildTranslationPrompt(chunks[i], i, chunks.length);
    // 中文注释：分块翻译，避免超长文档单次请求超出模型上下文
    const output = await translatePrompt(prompt);
    translated.push(output);
  }

  return translated.join("\n\n");
}

function buildAutoGeneratedHeader(sourcePath) {
  const now = new Date().toISOString();
  return `<!-- Auto-generated from ${sourcePath} at ${now}. Edit the Chinese source file, then re-run docs:en. -->\n\n`;
}

async function runTask(task, translatePrompt, dryRun) {
  const sourceAbs = path.resolve(process.cwd(), task.source);
  const targetAbs = path.resolve(process.cwd(), task.target);
  const sourceExists = await fileExists(sourceAbs);
  if (!sourceExists) {
    throw new Error(`源文件不存在: ${sourceAbs}`);
  }

  if (dryRun) {
    console.log(`[dry-run] ${task.source} -> ${task.target}`);
    return;
  }

  const markdown = await readFile(sourceAbs, "utf8");
  const translated = await translateMarkdown(markdown, translatePrompt);
  const finalContent = `${buildAutoGeneratedHeader(task.source)}${translated}`.trimEnd() + "\n";

  await mkdir(path.dirname(targetAbs), { recursive: true });
  await writeFile(targetAbs, finalContent, "utf8");
  console.log(`Generated: ${task.target}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await loadLocalEnv();
  const tasks = await loadTasks(args);

  if (args.dryRun) {
    for (const task of tasks) {
      await runTask(task, async () => "", true);
    }
    return;
  }

  const translator = createTranslator(args);

  for (const task of tasks) {
    await runTask(task, translator, args.dryRun);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

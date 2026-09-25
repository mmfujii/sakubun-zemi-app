#!/usr/bin/env node
// PostToolUse フック: Claude Code がファイルを編集・作成した直後に Biome で整形と lint 修正をかける。
// 自動で直せない lint エラーが残った場合は exit 2 で Claude に内容を返し、修正させる。
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { extname, join } from "node:path";

let raw = "";
for await (const chunk of process.stdin) raw += chunk;

let filePath = "";
try {
  filePath = JSON.parse(raw)?.tool_input?.file_path ?? "";
} catch {
  process.exit(0);
}

const TARGET_EXT = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".jsonc",
  ".css",
]);
if (!filePath || !TARGET_EXT.has(extname(filePath)) || !existsSync(filePath)) process.exit(0);

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const biome = join(projectDir, "node_modules", ".bin", "biome");
if (!existsSync(biome)) process.exit(0); // 依存が未インストールなら何もしない

const result = spawnSync(
  biome,
  ["check", "--write", "--no-errors-on-unmatched", "--files-ignore-unknown=true", filePath],
  { cwd: projectDir, encoding: "utf8" },
);

// biome 本体が起動できない（未インストール・別OSのバイナリ等）ときは邪魔をしない
if (result.error || /Cannot find module/.test(result.stderr ?? "")) process.exit(0);

if (result.status !== 0) {
  console.error(
    `Biome が自動修正できないエラーを検出しました（${filePath}）:\n${result.stdout}${result.stderr}`,
  );
  process.exit(2);
}
process.exit(0);

#!/usr/bin/env node
// PreToolUse フック: Claude Code が .env 系ファイルを読む・書くのを止める。
// .env.example は許可する。exit 2 で操作をブロックし、stderr の内容が Claude に返る。
import { basename } from "node:path";

let raw = "";
for await (const chunk of process.stdin) raw += chunk;

let filePath = "";
try {
  const input = JSON.parse(raw);
  filePath = input?.tool_input?.file_path ?? input?.tool_input?.path ?? "";
} catch {
  process.exit(0); // 入力が読めないときは何もしない
}

const name = basename(filePath);
if (/^\.env(\..+)?$/.test(name) && name !== ".env.example") {
  console.error(
    `${name} は秘密情報を含むため、Claude Code からの読み書きを禁止しています。` +
      "変数名は .env.example と turbo.json の globalEnv を参照してください。",
  );
  process.exit(2);
}
process.exit(0);

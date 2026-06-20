// 子ども向けサービスのコンテンツ安全チェック（V1 lib/content-safety.ts 移植）。
// 作文内容に不適切な表現がないか簡易チェックする。API(権威)とweb(即時UX)で共有。

const BLOCKED_PATTERNS = [
  // 暴力・犯罪
  /殺[すしせ]/,
  /死[ねにな]/,
  /爆破/,
  /爆弾/,
  /銃/,
  /ナイフで刺/,
  // 自傷
  /自殺/,
  /リスカ/,
  /死にたい/,
  // 性的表現
  /セックス/,
  /エロ/,
  /裸/,
  // 差別・ヘイト
  /殺せ/,
  /死ね/,
  // 個人情報（電話番号・郵便番号パターン）
  /\d{2,4}-\d{2,4}-\d{4}/,
  /\d{3}-\d{4}/,
];

// 注意が必要だが即ブロックはしない表現
const WARNING_PATTERNS = [/いじめ/, /暴力/, /けんか/];

export type SafetyResult = {
  safe: boolean;
  warnings: string[];
  blocked: boolean;
  reason?: string;
};

export function checkContentSafety(text: string): SafetyResult {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return {
        safe: false,
        warnings: [],
        blocked: true,
        reason:
          "この作文には添削できない表現が含まれている可能性があります。内容をご確認のうえ、もう一度お試しください。",
      };
    }
  }

  const warnings: string[] = [];
  for (const pattern of WARNING_PATTERNS) {
    if (pattern.test(text)) {
      warnings.push("センシティブな内容が含まれている可能性があります");
      break;
    }
  }

  return { safe: true, warnings, blocked: false };
}

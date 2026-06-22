"use client";

import { useEffect, useMemo, useRef } from "react";

const ROWS = 20;

// 行頭禁則文字
const KINSOKU = new Set("。、，．）」』】〕！？…‥ー");

// 縦書きで回転が必要な文字
const ROT = new Set("ー〜─―—");

// 縦書きで位置調整が必要な括弧類
// 開き括弧（「『（【〔）は縦書きでマス上部に配置
const OPEN_BRACKET = new Set("「『（【〔");
// 閉じ括弧（」』）】〕）は縦書きでマス下部に配置
const CLOSE_BRACKET = new Set("」』）】〕");

// 句読点セット
const PUNC_SET = new Set("、。，．");

type GenkouyoushiProps = {
  text: string;
  title?: string;
  name?: string;
  minCols?: number;
  compact?: boolean;
  /** 互換用（現在は未使用）。全列を1本の連続スクロールで表示する。 */
  colsPerPage?: number;
};

type CellData = {
  char: string;
  isPunct: boolean;
  isEmpty: boolean;
};

type ColumnData = {
  cells: CellData[];
  type: "title" | "name" | "body";
  markerLabel?: string;
};

/* 句読点をフォントで描画し、マス右上に配置する。 */
function PuncMark({ ch, cellPx }: { ch: string; cellPx: number }) {
  const fontSize = Math.round(cellPx * 0.7);
  return (
    <span
      style={{
        position: "absolute",
        top: "-18%",
        right: "-10%",
        width: "50%",
        height: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize,
        lineHeight: 1,
        color: "#333",
        pointerEvents: "none",
      }}
    >
      {ch}
    </span>
  );
}

function CellContent({
  ch,
  isRot,
  isPunc,
  cellPx,
}: {
  ch: string;
  isRot: boolean;
  isPunc: boolean;
  cellPx: number;
}) {
  if (!ch) return null;

  if (isPunc) {
    return <PuncMark ch={ch} cellPx={cellPx} />;
  }

  // 開き括弧: 縦書きでマス上寄りに90度回転
  if (OPEN_BRACKET.has(ch)) {
    return (
      <span
        style={{
          position: "absolute",
          top: "15%",
          left: "50%",
          transform: "translateX(-50%) rotate(90deg)",
          lineHeight: 1,
        }}
      >
        {ch}
      </span>
    );
  }

  // 閉じ括弧: 縦書きでマス下寄りに90度回転
  if (CLOSE_BRACKET.has(ch)) {
    return (
      <span
        style={{
          position: "absolute",
          bottom: "15%",
          left: "50%",
          transform: "translateX(-50%) rotate(90deg)",
          lineHeight: 1,
        }}
      >
        {ch}
      </span>
    );
  }

  return (
    <span
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: isRot ? "translate(-50%,-50%) rotate(90deg)" : "translate(-50%,-50%)",
        lineHeight: 1,
      }}
    >
      {ch}
    </span>
  );
}

function buildColumns(
  text: string,
  title: string | undefined,
  name: string | undefined,
  minCols: number,
): ColumnData[] {
  const columns: ColumnData[] = [];

  if (title) {
    const titleChars = Array.from(title);
    const maxPerCol = ROWS - 3; // 1列あたり最大17文字（上3マス空け）
    const colCount = Math.ceil(titleChars.length / maxPerCol);
    for (let c = 0; c < colCount; c++) {
      const start = c * maxPerCol;
      const slice = titleChars.slice(start, start + maxPerCol);
      const cells: CellData[] = [];
      const topOffset = c === 0 ? 3 : 1; // 1列目は3マス空け、2列目以降は1マス空け
      for (let r = 0; r < ROWS; r++) {
        const ci = r - topOffset;
        const ch = ci >= 0 && ci < slice.length ? slice[ci] : "";
        cells.push({ char: ch, isPunct: KINSOKU.has(ch), isEmpty: !ch });
      }
      columns.push({ cells, type: "title" });
    }
  }

  if (name) {
    const nameChars = Array.from(name);
    const start = ROWS - nameChars.length - 1;
    const cells: CellData[] = [];
    for (let r = 0; r < ROWS; r++) {
      const ci = r - start;
      const ch = ci >= 0 && ci < nameChars.length ? nameChars[ci] : "";
      cells.push({ char: ch, isPunct: KINSOKU.has(ch), isEmpty: !ch });
    }
    columns.push({ cells, type: "name" });
  }

  const chars = Array.from(text);
  const bodyColumns: CellData[][] = [];
  let i = 0;
  let paragraphIndent = true;

  while (i < chars.length && bodyColumns.length < 60) {
    const colChars: string[] = [];
    const startRow = paragraphIndent ? 1 : 0;

    for (let s = 0; s < startRow; s++) colChars.push("");

    paragraphIndent = false;

    for (let r = startRow; r < ROWS && i < chars.length; r++) {
      if (chars[i] === "\n") {
        i++;
        paragraphIndent = true;
        break;
      }
      colChars.push(chars[i]);
      i++;
    }
    bodyColumns.push(
      colChars.map((ch) => ({
        char: ch,
        isPunct: KINSOKU.has(ch),
        isEmpty: !ch,
      })),
    );
  }

  const totalBodyCols = Math.max(bodyColumns.length, minCols);
  for (let c = 0; c < totalBodyCols; c++) {
    const colData = bodyColumns[c] || [];
    const cells: CellData[] = [];
    for (let r = 0; r < ROWS; r++) {
      const cell = r < colData.length ? colData[r] : { char: "", isPunct: false, isEmpty: true };
      cells.push(cell);
    }

    const markerLabel = (c + 1) % 10 === 0 ? `${(c + 1) * ROWS}字` : undefined;
    columns.push({ cells, type: "body", markerLabel });
  }

  return columns;
}

/** 原稿用紙本体（全列を1つの横スクロールで表示） */
function GenkouyoushiPage({
  columns,
  cellClass,
  cellPx,
  scrollRef,
}: {
  columns: ColumnData[];
  cellClass: string;
  cellPx: number;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="gk-scroll" ref={scrollRef}>
      <div className="gk-grid">
        {[...columns].reverse().map((col, reverseIdx) => {
          const colIdx = columns.length - 1 - reverseIdx;
          return (
            <div
              key={colIdx}
              className={`gk-col ${
                col.type === "title" || col.type === "name" ? "gk-col-meta" : ""
              }`}
            >
              {col.cells.map((cell, rowIdx) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: 原稿用紙の位置依存マス。行位置=識別子で並び替わらないためindexで可
                  key={rowIdx}
                  className={`${cellClass} ${cell.isEmpty ? "gk-empty" : ""}`}
                  style={{ position: "relative", overflow: "visible" }}
                >
                  <CellContent
                    ch={cell.char}
                    isRot={ROT.has(cell.char)}
                    isPunc={PUNC_SET.has(cell.char)}
                    cellPx={cellPx}
                  />
                </div>
              ))}
              {col.markerLabel && <div className="gk-marker">{col.markerLabel}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Genkouyoushi({
  text,
  title,
  name,
  minCols = 20,
  compact = false,
}: GenkouyoushiProps) {
  const allColumns = useMemo(
    () => buildColumns(text, title, name, minCols),
    [text, title, name, minCols],
  );

  const charCount = Array.from(text.replace(/\n/g, "")).length;
  const cellClass = compact ? "gk-cell-sm" : "gk-cell";
  const cellPx = compact ? 24 : 32;
  const scrollRef = useRef<HTMLDivElement>(null);

  // 読みは右から。マウント時／列変更時に右端へスクロールして冒頭を表示。
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll to right when columns change
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollLeft = el.scrollWidth;
    }
  }, [allColumns]);

  return (
    <div className="gk-wrapper">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-400">原稿用紙</span>
        <span className="text-xs text-gray-400 tabular-nums">{charCount}字</span>
      </div>
      <GenkouyoushiPage
        columns={allColumns}
        cellClass={cellClass}
        cellPx={cellPx}
        scrollRef={scrollRef}
      />
    </div>
  );
}

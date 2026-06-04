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
  /** 1枚あたりのカラム数（デフォルト20=400字） */
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

  while (i < chars.length && bodyColumns.length < 30) {
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

/** 1枚の原稿用紙コンポーネント */
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
  colsPerPage = 20,
}: GenkouyoushiProps) {
  const allColumns = useMemo(
    () => buildColumns(text, title, name, minCols),
    [text, title, name, minCols],
  );

  const charCount = Array.from(text.replace(/\n/g, "")).length;
  const cellClass = compact ? "gk-cell-sm" : "gk-cell";
  const cellPx = compact ? 24 : 32;
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // メタ列（タイトル・名前）と本文列を分離
  const metaColumns = allColumns.filter((c) => c.type === "title" || c.type === "name");
  const bodyColumns = allColumns.filter((c) => c.type === "body");

  // 本文を colsPerPage ごとにページ分割
  const pages: ColumnData[][] = [];
  if (bodyColumns.length <= colsPerPage) {
    // 1枚に収まる場合: メタ列 + 本文
    pages.push([...metaColumns, ...bodyColumns]);
  } else {
    // 複数枚: 1枚目にメタ列 + 最初のcolsPerPage列、2枚目以降は本文のみ
    for (let i = 0; i < bodyColumns.length; i += colsPerPage) {
      const pageCols = bodyColumns.slice(i, i + colsPerPage);
      // 足りない列を空列で埋める
      while (pageCols.length < colsPerPage) {
        const emptyCells: CellData[] = Array.from({ length: ROWS }, () => ({
          char: "",
          isPunct: false,
          isEmpty: true,
        }));
        pageCols.push({ cells: emptyCells, type: "body" });
      }
      if (i === 0) {
        pages.push([...metaColumns, ...pageCols]);
      } else {
        pages.push(pageCols);
      }
    }
  }

  const isMultiPage = pages.length > 1;

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll to right when columns change
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollLeft = el.scrollWidth;
    }
  }, [allColumns]);

  // Prevent swipe-back navigation when scrolling horizontally
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - touchStartRef.current.x);
      const dy = Math.abs(touch.clientY - touchStartRef.current.y);

      // 明確に横スクロール（横が縦の3倍以上）かつスクロール可能な場合のみ抑制
      const canScrollH = el.scrollWidth > el.clientWidth;
      if (canScrollH && dx > dy * 3 && dx > 15) {
        e.preventDefault();
      }
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  // 1枚の場合は従来通り
  if (!isMultiPage) {
    return (
      <div className="gk-wrapper">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-gray-400">原稿用紙</span>
          <span className="text-xs text-gray-400 tabular-nums">{charCount}字</span>
        </div>
        <GenkouyoushiPage
          columns={pages[0]}
          cellClass={cellClass}
          cellPx={cellPx}
          scrollRef={scrollRef}
        />
      </div>
    );
  }

  // 複数枚: 横スクロールでページを並べる
  return (
    <div className="gk-wrapper">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-400">原稿用紙</span>
        <span className="text-xs text-gray-400 tabular-nums">{charCount}字</span>
      </div>
      <div
        ref={scrollRef}
        className="flex flex-row-reverse gap-4 overflow-x-auto snap-x snap-mandatory pb-2"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {pages.map((pageCols, pageIdx) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: 原稿用紙のページ位置=識別子。並び替わらないためindexで可
            key={pageIdx}
            className="flex-shrink-0 snap-center"
            style={{ minWidth: "min(100%, 600px)" }}
          >
            <div className="text-center mb-2">
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {pageIdx + 1}枚目
              </span>
            </div>
            <GenkouyoushiPage columns={pageCols} cellClass={cellClass} cellPx={cellPx} />
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-1.5 mt-2">
        {pages.map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: 固定数のページ送りドット。並び替わらず安定IDも無いためindexで可
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        ))}
      </div>
    </div>
  );
}

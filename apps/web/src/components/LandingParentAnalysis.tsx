"use client";

import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  Home,
  Lightbulb,
  MessageCircle,
  PenLine,
  Pin,
  Puzzle,
  Search,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { useState } from "react";

export default function LandingParentAnalysis() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl border text-xs font-semibold transition-all duration-200 active:scale-[0.98] ${
          open
            ? "border-slate-300 bg-slate-100 text-slate-600"
            : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
        }`}
      >
        <Users size={14} />
        {open ? "保護者向け分析を閉じる" : "保護者向け分析を見る"}
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="space-y-3 mt-3 animate-scale-in">
          {/* 総合所見 */}
          <div className="bg-slate-50 rounded-xl p-4 ring-1 ring-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-slate-200 flex items-center justify-center">
                <BarChart3 size={12} className="text-slate-600" />
              </div>
              <p className="text-xs font-bold text-slate-800">総合所見</p>
            </div>
            <p className="text-[11px] text-slate-700 leading-relaxed">
              体験を具体的に描写する力が育ってきています。特に五感を使った表現（手ざわり、色など）が自然に使えている点が大きな強みです。一方で、文章の構成面では「なぜ大切なのか」という理由づけの部分をもう少し掘り下げると、説得力のある作文になります。
            </p>
          </div>

          {/* 分析内訳 */}
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center">
                <Search size={12} className="text-gray-500" />
              </div>
              <p className="text-xs font-bold text-gray-900">分析内訳</p>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-gray-50 rounded-lg px-2.5 py-1.5 text-center flex-1">
                <p className="text-base font-bold text-gray-800">5</p>
                <p className="text-[9px] text-gray-500">検出した課題</p>
              </div>
              <ChevronRight size={12} strokeWidth={2.5} className="text-gray-400 flex-shrink-0" />
              <div
                className="rounded-lg px-2.5 py-1.5 text-center flex-1"
                style={{ background: "#d9eadf" }}
              >
                <p className="text-base font-bold" style={{ color: "#2f6e59" }}>
                  2
                </p>
                <p className="text-[9px]" style={{ color: "#5fa488" }}>
                  子どもに提示
                </p>
              </div>
            </div>
            <div className="space-y-1">
              {[
                ["構成・段落", "2件"],
                ["表現・語彙", "1件"],
                ["表記・文法", "1件"],
                ["字数の過不足", "1件"],
              ].map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-600">{cat}</span>
                  <span className="font-bold text-gray-800 tabular-nums">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 今回このポイントを選んだ理由 */}
          <div className="bg-slate-50 rounded-xl p-4 ring-1 ring-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-slate-200 flex items-center justify-center">
                <MessageCircle size={12} className="text-slate-600" />
              </div>
              <p className="text-xs font-bold text-slate-800">今回このポイントを選んだ理由</p>
            </div>
            <p className="text-[11px] text-slate-700 leading-relaxed">
              「気持ちの理由づけ」と「文の構成」は、今の学年で伸ばしやすく、次の作文にすぐ活かせるポイントです。表記の誤りは1箇所のみで軽微なため、今回は子どもへの提示を省きました。
            </p>
          </div>

          {/* ご家庭での声かけ */}
          <div className="bg-slate-50 rounded-xl p-4 ring-1 ring-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-slate-200 flex items-center justify-center">
                <Home size={12} className="text-slate-600" />
              </div>
              <p className="text-xs font-bold text-slate-800">ご家庭での声かけ</p>
            </div>
            <p className="text-[11px] text-slate-700 leading-relaxed">
              「くまちゃんのどこが一番好き？」のように、お子さまの気持ちを引き出す質問をしてみてください。日常会話の中で「なぜそう思ったの？」と聞く習慣が、作文の理由づけの力につながります。
            </p>
          </div>

          {/* 表記・文法の指摘 */}
          <div className="bg-slate-50 rounded-xl p-4 ring-1 ring-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-slate-200 flex items-center justify-center">
                <Pin size={12} className="text-slate-600" />
              </div>
              <p className="text-xs font-bold text-slate-800">表記・文法の指摘</p>
            </div>
            <div className="space-y-2.5">
              {[
                {
                  original: "こきゅうのしくみ",
                  suggestion: "呼吸のしくみ",
                  reason:
                    "「呼吸（こきゅう）」の促音（っ）が抜けています。「こきゅう」が正しい表記です。",
                },
                {
                  original: "さい後いろいろと調べたりし、て",
                  suggestion: "その後いろいろと調べたりして",
                  reason:
                    "「さい後」は「最後」の誤りと思われますが、文脈上「その後」が自然です。読点の位置も修正しています。",
                },
                {
                  original: "よいくうきをだす",
                  suggestion: "よい空気を出す",
                  reason:
                    "「くうき」は小学1年生で習う「空気」で書けます。「だす」も「出す」と書けるとさらに良いです。",
                },
              ].map((item) => (
                <div key={item.original} className="bg-white/60 rounded-lg px-3 py-2.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="line-through opacity-50 bg-slate-200 text-[10px] px-1.5 py-0.5 rounded">
                      {item.original}
                    </span>
                    <ChevronRight
                      size={10}
                      strokeWidth={2.5}
                      className="text-slate-400 flex-shrink-0"
                    />
                    <span className="font-bold bg-emerald-50 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded">
                      {item.suggestion}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">{item.reason}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 漢字で書けるとさらに良いところ */}
          <div className="bg-slate-50 rounded-xl p-4 ring-1 ring-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-slate-200 flex items-center justify-center">
                <PenLine size={12} className="text-slate-600" />
              </div>
              <p className="text-xs font-bold text-slate-800">漢字で書けるとさらに良いところ</p>
            </div>
            <div className="space-y-1.5">
              {[
                "「すう」→「吸う」（小学6年生で習う漢字です）",
                "「ひと」→「人」（小学1年生で習う漢字です）",
                "「もり」→「森」（小学1年生で習う漢字です）",
              ].map((note) => (
                <div key={note} className="flex items-start gap-2 text-[11px]">
                  <span className="text-slate-400 mt-0.5 flex-shrink-0">●</span>
                  <span className="text-slate-700">{note}</span>
                </div>
              ))}
            </div>
          </div>

          {/* カテゴリ別スコア */}
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-bold text-gray-900 mb-3">カテゴリ別スコア</p>
            <div className="space-y-3">
              {[
                { icon: <Target size={12} />, label: "課題把握力", score: 14 },
                { icon: <Puzzle size={12} />, label: "論理性", score: 11 },
                { icon: <Sparkles size={12} />, label: "表現力", score: 14 },
                { icon: <Lightbulb size={12} />, label: "独自性", score: 13 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-gray-600 flex items-center gap-1">
                      {item.icon}
                      <span>{item.label}</span>
                    </span>
                    <span className="text-[11px] font-bold text-gray-800">
                      {item.score}
                      <span className="text-gray-400 font-normal">/25</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.score >= 20 ? "bg-brand" : item.score >= 15 ? "bg-amber-400" : "bg-red-400"}`}
                      style={{ width: `${(item.score / 25) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 採点コメント */}
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-bold text-gray-900 mb-3">採点コメント</p>
            <div className="space-y-3">
              {[
                {
                  icon: <Target size={12} />,
                  label: "課題把握力",
                  score: 14,
                  text: "自由作文として「地球温暖化と森林」というテーマを設定しており、テーマ自体は明瞭です。ただし、作文の後半で「きっかけが問題解決につながる」という別のテーマに移ってしまい、一貫性が崩れています。",
                },
                {
                  icon: <Puzzle size={12} />,
                  label: "論理性",
                  score: 11,
                  text: "「森林を増やすべき→植物の場所に行った→環境問題を調べた→きっかけが大切→問題解決につながる」という流れは、各段落のつながりが弱く、話が飛躍しています。",
                },
                {
                  icon: <Sparkles size={12} />,
                  label: "表現力",
                  score: 14,
                  text: "「二酸化炭素をすう」「光合成のしくみ」など、テーマに合った語彙は使えています。一方で意味が取りにくい表現や文の途中で区切れてしまっている箇所が複数あります。",
                },
                {
                  icon: <Lightbulb size={12} />,
                  label: "独自性",
                  score: 13,
                  text: "植物について学べる場所に実際に行ったという体験が書かれており、自分の経験を盛り込もうとする姿勢は評価できます。ただし具体的な描写がなく、体験の輪郭がぼんやりしてしまっています。",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="border-b border-gray-50 pb-2.5 last:border-0 last:pb-0"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                      {item.icon} {item.label}
                    </span>
                    <span
                      className={`text-[11px] font-bold tabular-nums ${item.score >= 20 ? "text-brand" : item.score >= 15 ? "text-amber-500" : "text-red-500"}`}
                    >
                      {item.score}/25
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-600 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

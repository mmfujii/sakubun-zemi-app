import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BookOpenText,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  FileText,
  Home as HomeIcon,
  MessageCircle,
  Mic,
  Pen,
  PenLine,
  Quote,
  Search,
  Shield,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import Genkouyoushi from "@/components/Genkouyoushi";
import LandingParentAnalysis from "@/components/LandingParentAnalysis";
import { Button, Container, FeatureCard, SectionHeading } from "@/components/landing";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-bg">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm bg-brand-dark">
              <Pen size={16} stroke="white" strokeWidth={2.5} />
            </div>
            <span className="text-base font-extrabold tracking-tight whitespace-nowrap text-ink">
              さくぶんゼミ
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/login"
              className="text-xs font-semibold hover:transition-colors px-2 py-2 whitespace-nowrap text-muted"
            >
              ログイン
            </Link>
            <Link
              href="/signup"
              className="text-xs font-bold text-white bg-brand hover:bg-brand-dark px-4 py-2 rounded-xl transition-all active:scale-[0.98] whitespace-nowrap"
            >
              無料で始める
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-brand-texture">
        <div className="relative max-w-5xl mx-auto px-5 pt-16 pb-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-full mb-6 animate-fade-in bg-accent text-brand-dark">
            <Sparkles size={13} />
            小学生のための AI 作文添削
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-5 animate-slide-up text-bg">
            作文が苦手な
            <br />
            <span className="text-accent">小学生に。</span>
          </h1>

          <p className="text-base sm:text-lg max-w-lg mx-auto leading-relaxed mb-4 animate-slide-up stagger-1 text-bg/90">
            手書き作文は写真で、話すだけの音声入力も。
            <br className="hidden sm:block" />
            AIがやさしく褒めながら、次に直すポイントを伝えます。
          </p>

          {/* 特長タグ */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6 animate-slide-up stagger-1">
            {[
              "小学生向け",
              "手書き作文OK",
              "音声入力対応",
              "保護者向け分析つき",
              "いつでもキャンセル可能",
            ].map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-semibold px-3 py-1 rounded-full bg-bg/15 text-bg/90"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-slide-up stagger-2">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-bold text-base px-8 py-4 rounded-2xl transition-all active:scale-[0.98] bg-accent text-brand-dark"
            >
              無料で始める
              <ChevronRight size={18} />
            </Link>
            <p className="text-xs text-bg/60">クレジットカード不要・1回無料体験つき</p>
          </div>

          {/* Hero visual — PC: 2カラム（添削結果 | 原稿用紙） */}
          <div className="mt-14 animate-slide-up stagger-3">
            <div className="flex flex-col lg:flex-row gap-6 max-w-4xl mx-auto">
              {/* 添削結果カード */}
              <div className="bg-white rounded-3xl shadow-soft-lg border border-gray-100 overflow-hidden lg:w-1/2 lg:flex-shrink-0">
                {/* Score header — yellow chalkboard texture */}
                <div
                  className="p-6 text-center relative"
                  style={{
                    background: "#f4d944 url(/yellow-texture.png)",
                    backgroundSize: "400px 400px",
                  }}
                >
                  <BookOpenText size={28} className="mx-auto mb-1 text-brand-dark" />
                  <div className="text-5xl font-extrabold tracking-tight text-ink">
                    85
                    <span className="text-xl font-medium text-brand-dark">/100</span>
                  </div>
                  <p className="text-sm mt-1 text-brand-dark">よく書けています！</p>
                </div>

                <div className="p-5 space-y-3 text-left">
                  {/* よかったところ */}
                  <div className="bg-brand-50 rounded-xl p-3.5 border border-brand/10">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Sparkles size={14} className="text-brand" />
                      <p className="text-xs font-bold text-brand">よかったところ</p>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed pl-[22px]">
                      くまちゃんとの思い出がとても具体的に書けていて、読んでいてリアルさが伝わりました！
                    </p>
                  </div>

                  {/* なおすところ */}
                  <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-200/50">
                    <div className="flex items-center gap-2 mb-1.5">
                      <TrendingUp size={14} className="text-amber-600" />
                      <p className="text-xs font-bold text-amber-700">今回なおすところ</p>
                    </div>
                    <div className="pl-[22px]">
                      <p className="text-xs font-semibold text-gray-700 mb-0.5">
                        気持ちをもっとくわしく書いてみよう
                      </p>
                      <p className="text-xs text-amber-600 leading-relaxed">
                        「どんなときにうれしいか」も書くと、もっと気持ちが伝わるよ。
                      </p>
                    </div>
                  </div>

                  {/* 次にがんばること */}
                  <div className="bg-brand-50 rounded-xl p-3.5 border border-brand/10">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Target size={14} className="text-brand" />
                      <p className="text-xs font-bold text-brand">次にがんばること</p>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed pl-[22px]">
                      次の作文では、最初に「一番言いたいこと」を1つ決めてから書き始めてみよう
                    </p>
                  </div>

                  {/* 保護者向け分析アコーディオン */}
                  <LandingParentAnalysis />
                </div>
              </div>

              {/* 原稿用紙 */}
              <div className="min-w-0 lg:w-1/2">
                <Genkouyoushi
                  text={
                    "きのう、おばあちゃんの家に行きました。おばあちゃんの家にはとても大きな木があります。その木の下で、おばあちゃんといっしょにすいかを食べました。すいかはとてもあまくて、たねをとばしながら食べました。おばあちゃんは「夏はすいかがいちばんだね」と言って、にこにこしていました。\nぼくはそのとき、すごくうれしかったです。でも、どうしてうれしかったのか、うまく言えませんでした。たぶん、おばあちゃんとすごす時間がすきだからだと思います。\nまた夏になったら、おばあちゃんの家に行きたいです。こんどはいっしょにかき氷も食べたいです。"
                  }
                  title="夏休みの思い出"
                  name="たろう"
                  compact
                  minCols={10}
                />
              </div>
            </div>
            <p className="text-xs mt-3 text-center text-bg/50">※ 添削結果のイメージです</p>
          </div>
        </div>
      </section>

      {/* ─── お悩みブロック ─── */}
      <section className="py-20 bg-bg">
        <Container maxWidth="3xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3 text-brand-dark">
              こんなお悩みはありませんか？
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { emoji: "✏️", text: "作文になると手が止まってしまう" },
              { emoji: "😥", text: "何を書けばいいかわからないと言われる" },
              { emoji: "📖", text: "読書感想文や意見文がいつも苦手" },
              { emoji: "😩", text: "親が毎回つきっきりで見るのが大変" },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-4 bg-white rounded-2xl p-5 border border-gray-100 shadow-soft"
              >
                <span className="text-2xl shrink-0">{item.emoji}</span>
                <p className="text-sm font-semibold text-ink">{item.text}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-sm mt-8 leading-relaxed text-muted">
            さくぶんゼミなら、
            <span className="font-bold text-brand-dark">
              良いところを褒めながら、
              <br className="sm:hidden" />
              次に直すポイントをわかりやすく伝えます。
            </span>
          </p>
        </Container>
      </section>

      {/* ─── Feedback Showcase — for kids ─── */}
      <section className="py-20 bg-brand-texture">
        <Container>
          <SectionHeading
            badge="子ども向けフィードバック"
            badgeIcon={<Sparkles size={12} />}
            badgeBg="bg-bg/20"
            badgeColor="text-bg"
            heading="1回でも、次に何を直せばいいかわかる"
            headingColor="text-bg"
            sub="褒めながら伸ばすから、書くのが嫌になりにくい。お子さまが自分で「なおしてみよう」と思える添削です。"
            subColor="text-bg/80"
          />

          <div className="grid sm:grid-cols-2 gap-5 mt-10 max-w-2xl mx-auto">
            {[
              {
                icon: <Star size={22} className="text-brand-dark" />,
                title: "100点満点のスコア",
                desc: "4つの観点で採点。得意と苦手が一目でわかるから、何を伸ばせばいいか迷いません。",
              },
              {
                icon: <Sparkles size={22} className="text-brand-dark" />,
                title: "よかったところ",
                desc: "良い点を具体的に褒めるから、「書いてよかった」と思える。書くことが嫌にならない工夫です。",
              },
              {
                icon: <PenLine size={22} className="text-brand-dark" />,
                title: "今回なおすところ",
                desc: "改善ポイントは2つだけに絞って提示。書き直し例つきで、すぐに実践できます。",
              },
              {
                icon: <Target size={22} className="text-brand-dark" />,
                title: "次にがんばること",
                desc: "意識すべきことを1つだけ提示。小さなステップで着実にレベルアップできます。",
              },
            ].map((feature) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                desc={feature.desc}
                className="bg-white/95 border border-white/30"
              />
            ))}
          </div>
        </Container>
      </section>

      {/* ─── Parent analysis showcase ─── */}
      <section className="py-20 bg-bg">
        <Container>
          <SectionHeading
            badge="保護者向け分析"
            badgeIcon={<Users size={12} />}
            badgeBg="bg-brand-dark"
            badgeColor="text-bg"
            heading="お子さまの「今」と「伸ばし方」がわかる"
            headingColor="text-brand-dark"
            sub="子どもへの添削とは別に、保護者の方だけが見られる詳細な分析レポートをご用意。つきっきりで見なくても、お子さまの状況を把握できます。"
            subColor="text-muted"
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
            {[
              {
                icon: <BarChart3 size={22} className="text-brand-dark" />,
                title: "今の実力がひと目でわかる",
                desc: "何ができていて何が足りないか、保護者の方向けにわかりやすくまとめます。",
              },
              {
                icon: <Search size={22} className="text-brand-dark" />,
                title: "どこを直せばいいか一目瞭然",
                desc: "課題の一覧と、なぜそのポイントを選んだかの理由もセットでお伝えします。",
              },
              {
                icon: <MessageCircle size={22} className="text-brand-dark" />,
                title: "納得してサポートできる",
                desc: "なぜこのアドバイスを選んだのか理由がわかるので、家庭でも安心してサポートできます。",
              },
              {
                icon: <HomeIcon size={22} className="text-brand-dark" />,
                title: "声かけのヒントつき",
                desc: "「こう聞いてみて」など、すぐ使える声かけ例を毎回ご提案。つきっきりでなくても大丈夫です。",
              },
            ].map((feature) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                desc={feature.desc}
                className="bg-white border border-gray-100"
              />
            ))}
          </div>

          {/* そのほかの特長 */}
          <div className="mt-16">
            <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-center mb-6 text-brand-dark">
              そのほかの特長
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 max-w-4xl mx-auto">
              {[
                {
                  icon: <Camera size={20} className="text-brand-dark" />,
                  title: "手書き作文を写真で送れる",
                  desc: "撮影して送信するだけ。読み取り結果を確認・修正してから添削へ進めます。",
                },
                {
                  icon: <Mic size={20} className="text-brand-dark" />,
                  title: "声で作文が書ける",
                  desc: "話すだけで文字に変換。まだキーボードに慣れていないお子さまにも。",
                },
                {
                  icon: <FileText size={20} className="text-brand-dark" />,
                  title: "原稿用紙で表示",
                  desc: "添削結果を原稿用紙形式で表示。マス目の使い方が自然と身につきます。",
                },
                {
                  icon: <BookOpen size={20} className="text-brand-dark" />,
                  title: "お題が選べる",
                  desc: "テーマ作文やいけん作文など多彩なお題をご用意。自由作文もOK。",
                },
              ].map((feature) => (
                <FeatureCard
                  key={feature.title}
                  icon={feature.icon}
                  title={feature.title}
                  desc={feature.desc}
                  layout="center"
                  iconBoxSize="w-10 h-10"
                />
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ─── How it works ─── */}
      <section className="py-20 bg-brand-texture">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3 text-bg">
              かんたん3ステップ
            </h2>
            <p className="text-sm text-bg/80">はじめての方でもすぐに使えます</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              {
                step: "1",
                title: "作文を書く",
                desc: "キーボード・音声入力・手書き写真から選べる",
                icon: <Pen size={24} className="text-brand-dark" strokeWidth={2.5} />,
              },
              {
                step: "2",
                title: "AIが添削",
                desc: "やさしい言葉で良い点・改善点をフィードバック",
                icon: <Sparkles size={24} className="text-brand-dark" strokeWidth={2.5} />,
              },
              {
                step: "3",
                title: "結果を確認",
                desc: "原稿用紙表示・スコア・漢字アドバイスつき",
                icon: <CheckCircle2 size={24} className="text-brand-dark" strokeWidth={2.5} />,
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-accent">
                  {item.icon}
                </div>
                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold mb-3 bg-brand-dark">
                  {item.step}
                </div>
                <h3 className="font-bold mb-1.5 text-bg">{item.title}</h3>
                <p className="text-sm text-bg/80">{item.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ─── Pricing ─── */}
      <section className="py-20 bg-bg">
        <Container>
          <div className="text-center mb-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3 text-brand-dark">
              料金プラン
            </h2>
            <p className="text-sm mb-8 text-muted">
              作文が苦手なお子さまでも始めやすい料金設計です
            </p>
            {/* ステップ表示 */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-4">
              <div className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full border border-gray-200 bg-white text-ink">
                <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center bg-brand-dark text-white">
                  1
                </span>
                まず無料で1回体験
              </div>
              <ArrowRight size={16} className="hidden sm:block text-muted" />
              <span className="text-xs sm:hidden text-muted">▼</span>
              <div className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full border border-gray-200 bg-white text-ink">
                <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center bg-brand-dark text-white">
                  2
                </span>
                初月990円でしっかりお試し
              </div>
              <ArrowRight size={16} className="hidden sm:block text-muted" />
              <span className="text-xs sm:hidden text-muted">▼</span>
              <div className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full border border-gray-200 bg-white text-ink">
                <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center bg-brand-dark text-white">
                  3
                </span>
                2ヶ月目〜 月額1,980円
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto mt-10">
            {/* Free */}
            <div className="bg-white rounded-3xl p-7 shadow-soft">
              <p className="font-bold mb-1 text-ink">無料プラン</p>
              <p className="text-xs mb-5 text-muted">まずはお試し</p>
              <div className="mb-5">
                <span className="text-3xl font-extrabold text-ink">0</span>
                <span className="text-sm ml-1 text-muted">円</span>
              </div>
              <ul className="space-y-2.5 mb-6">
                <li className="flex items-center gap-2 text-sm text-muted">
                  <Check size={14} className="flex-shrink-0 text-muted" strokeWidth={2.5} />
                  添削1回（お試し）
                </li>
                <li className="flex items-center gap-2 text-sm text-muted">
                  <Check size={14} className="flex-shrink-0 text-muted" strokeWidth={2.5} />
                  全機能を体験可能
                </li>
                <li className="flex items-center gap-2 text-sm text-muted">
                  <Check size={14} className="flex-shrink-0 text-muted" strokeWidth={2.5} />
                  クレジットカード不要
                </li>
              </ul>
              <Button href="/signup" variant="outline" block size="md" radius="xl">
                無料で始める
              </Button>
            </div>

            {/* Light */}
            <div className="bg-white rounded-3xl p-7 shadow-soft-lg relative border-2 border-accent">
              <div className="absolute -top-3 left-6 text-[10px] font-bold px-3 py-1 rounded-full bg-accent text-brand-dark">
                初月50%オフ
              </div>
              <p className="font-bold mb-1 text-ink">ライトプラン</p>
              <p className="text-xs mb-5 text-muted">しっかり添削</p>
              <div className="mb-1">
                <span className="text-sm line-through mr-2 text-muted">1,980円</span>
                <span className="text-3xl font-extrabold text-brand-dark">990</span>
                <span className="text-sm ml-1 text-muted">円/初月</span>
              </div>
              <p className="text-xs mb-5 text-muted">2ヶ月目から月額1,980円</p>
              <ul className="space-y-2.5 mb-6">
                <li className="flex items-center gap-2 text-sm text-ink">
                  <Check size={14} className="flex-shrink-0 text-brand-dark" strokeWidth={2.5} />
                  添削 月30回まで
                </li>
                <li className="flex items-center gap-2 text-sm text-ink">
                  <Check size={14} className="flex-shrink-0 text-brand-dark" strokeWidth={2.5} />
                  AIによる詳細フィードバック
                </li>
                <li className="flex items-center gap-2 text-sm text-ink">
                  <Check size={14} className="flex-shrink-0 text-brand-dark" strokeWidth={2.5} />
                  書き直し例・漢字アドバイス
                </li>
                <li className="flex items-center gap-2 text-sm text-ink">
                  <Check size={14} className="flex-shrink-0 text-brand-dark" strokeWidth={2.5} />
                  保護者向け分析レポート
                </li>
                <li className="flex items-center gap-2 text-sm text-ink">
                  <Check size={14} className="flex-shrink-0 text-brand-dark" strokeWidth={2.5} />
                  いつでもキャンセル可能
                </li>
              </ul>
              <Button
                href="/signup"
                variant="primary"
                block
                size="md"
                radius="xl"
                className="shadow-brand"
              >
                無料で始める
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── 利用者の声 ─── */}
      <section className="py-20 bg-bg">
        <Container>
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full mb-4 bg-accent/30 text-brand-dark">
              <Users size={13} />
              利用者の声
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
              利用者の声
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {/* ── 保護者（奥様） ── */}
            <div
              className="rounded-2xl p-6 border shadow-soft flex flex-col"
              style={{ backgroundColor: "#ffffff", borderColor: "#e8ede9" }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-14 h-14 rounded-full shrink-0 overflow-hidden"
                  style={{ backgroundColor: "#fef3cd" }}
                >
                  <svg
                    viewBox="0 0 56 56"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    {/* body */}
                    <ellipse cx="28" cy="52" rx="16" ry="11" fill="#5fa488" />
                    {/* collar */}
                    <path d="M22 39l6 3 6-3" stroke="#4a8c6f" strokeWidth="1" fill="none" />
                    {/* neck */}
                    <rect x="25" y="33" width="6" height="5" rx="2" fill="#f0d0a0" />
                    {/* hair back - bob */}
                    <ellipse cx="28" cy="21" rx="13" ry="14" fill="#5c4033" />
                    {/* hair sides - bob length */}
                    <rect x="15" y="18" width="4" height="14" rx="2" fill="#5c4033" />
                    <rect x="37" y="18" width="4" height="14" rx="2" fill="#5c4033" />
                    {/* face */}
                    <ellipse cx="28" cy="24" rx="10" ry="10.5" fill="#f0d0a0" />
                    {/* hair bangs */}
                    <path
                      d="M16 20c1-7 6-12 12-12s11 5 12 12c0 0-3-7-12-7s-12 7-12 7z"
                      fill="#5c4033"
                    />
                    {/* eyes */}
                    <ellipse cx="23" cy="25" rx="1.3" ry="1.6" fill="#3d3d3d" />
                    <ellipse cx="33" cy="25" rx="1.3" ry="1.6" fill="#3d3d3d" />
                    {/* eyebrows */}
                    <path d="M21 22q2-1.5 4 0" stroke="#5c4033" strokeWidth="0.8" fill="none" />
                    <path d="M31 22q2-1.5 4 0" stroke="#5c4033" strokeWidth="0.8" fill="none" />
                    {/* smile */}
                    <path
                      d="M24 30q4 3 8 0"
                      stroke="#c47a5a"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    {/* cheeks */}
                    <circle cx="20.5" cy="28.5" r="2.2" fill="#f5c0b0" opacity="0.45" />
                    <circle cx="35.5" cy="28.5" r="2.2" fill="#f5c0b0" opacity="0.45" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">40代 Mさん（保護者）</p>
                  <p className="text-xs text-muted">都立中高一貫校 在校生・受検生の母</p>
                </div>
              </div>
              <div
                className="flex-1 rounded-xl p-4 relative"
                style={{ backgroundColor: "#f8f9f8" }}
              >
                <Quote size={16} className="mb-2" style={{ color: "#c8d4cc" }} />
                <p className="text-sm leading-relaxed" style={{ color: "#555d58" }}>
                  都立中高一貫校の受検にあたり、作文をしっかり書けるようになることが我が家の大きな課題でした。通っている都立中受検対策の専門塾はとても信頼しているのですが、カリキュラムの性質上、作文だけに多くの時間を割くのは難しいと感じていました。かといって塾を変えるつもりもなく、何か自宅でプラスできるものはないかと探していたときに出会ったのが、さくぶんゼミです。自宅で取り組めるので、塾で忙しい中でも無理なく続けられています。塾のテストで書いた作文も提出してフィードバックをもらうことで、より多角的に力を伸ばせていると感じています。
                </p>
              </div>
            </div>

            {/* ── 中学生（娘さん・中2） ── */}
            <div
              className="rounded-2xl p-6 border shadow-soft flex flex-col"
              style={{ backgroundColor: "#ffffff", borderColor: "#e8ede9" }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-14 h-14 rounded-full shrink-0 overflow-hidden"
                  style={{ backgroundColor: "#d4edda" }}
                >
                  <svg
                    viewBox="0 0 56 56"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    {/* body */}
                    <ellipse cx="28" cy="52" rx="16" ry="11" fill="#2f6e59" />
                    {/* collar */}
                    <path d="M22 39l6 3 6-3" stroke="#1a5040" strokeWidth="1" fill="none" />
                    {/* neck */}
                    <rect x="25" y="33" width="6" height="5" rx="2" fill="#f0d0a0" />
                    {/* hair back - long */}
                    <ellipse cx="28" cy="22" rx="13" ry="14" fill="#3d2b1f" />
                    {/* long hair sides */}
                    <rect x="15" y="20" width="4" height="18" rx="2" fill="#3d2b1f" />
                    <rect x="37" y="20" width="4" height="18" rx="2" fill="#3d2b1f" />
                    {/* face */}
                    <ellipse cx="28" cy="24" rx="10" ry="10.5" fill="#f0d0a0" />
                    {/* hair bangs */}
                    <path
                      d="M16 19c1-7 6-12 12-12s11 5 12 12c0 0-3-7-12-7s-12 7-12 7z"
                      fill="#3d2b1f"
                    />
                    {/* ponytail */}
                    <ellipse
                      cx="40"
                      cy="15"
                      rx="4"
                      ry="6"
                      fill="#3d2b1f"
                      transform="rotate(25 40 15)"
                    />
                    {/* hair tie */}
                    <circle cx="37.5" cy="13" r="2" fill="#f4d94f" />
                    {/* eyes - bigger, cute */}
                    <ellipse cx="23" cy="25" rx="1.5" ry="1.8" fill="#3d3d3d" />
                    <ellipse cx="33" cy="25" rx="1.5" ry="1.8" fill="#3d3d3d" />
                    {/* eye highlights */}
                    <circle cx="23.8" cy="24.2" r="0.6" fill="white" />
                    <circle cx="33.8" cy="24.2" r="0.6" fill="white" />
                    {/* smile */}
                    <path
                      d="M24 30q4 2.5 8 0"
                      stroke="#c47a5a"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    {/* cheeks */}
                    <circle cx="20.5" cy="28.5" r="2.2" fill="#f5c0b0" opacity="0.45" />
                    <circle cx="35.5" cy="28.5" r="2.2" fill="#f5c0b0" opacity="0.45" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">中学2年生</p>
                  <p className="text-xs text-muted">都立中高一貫校 在校</p>
                </div>
              </div>
              <div
                className="flex-1 rounded-xl p-4 relative"
                style={{ backgroundColor: "#f8f9f8" }}
              >
                <Quote size={16} className="mb-2" style={{ color: "#c8d4cc" }} />
                <p className="text-sm leading-relaxed" style={{ color: "#555d58" }}>
                  弟が使っているのを見て、私も試してみました。私は塾の先生に直接質問するのが苦手な性格なので、作文の写真を送ればフィードバックがもらえるのが自分に合っていると思いました。テストで書いた作文も、なぜその点数になったのかをわかりやすく指摘してもらえますし、漢字や表記・文法の間違いも一つひとつ教えてくれるので助かっています。自分の受検前に知りたかったです。
                </p>
              </div>
            </div>

            {/* ── 小学生（息子さん・小6） ── */}
            <div
              className="rounded-2xl p-6 border shadow-soft flex flex-col"
              style={{ backgroundColor: "#ffffff", borderColor: "#e8ede9" }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-14 h-14 rounded-full shrink-0 overflow-hidden"
                  style={{ backgroundColor: "#fef3cd" }}
                >
                  <svg
                    viewBox="0 0 56 56"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    {/* body */}
                    <ellipse cx="28" cy="52" rx="16" ry="11" fill="#f4d94f" />
                    {/* collar */}
                    <path d="M22 39l6 3 6-3" stroke="#d4b93f" strokeWidth="1" fill="none" />
                    {/* neck */}
                    <rect x="25" y="33" width="6" height="5" rx="2" fill="#f0d0a0" />
                    {/* face */}
                    <ellipse cx="28" cy="24" rx="10" ry="10.5" fill="#f0d0a0" />
                    {/* hair - short and neat */}
                    <path d="M16 20c1-8 6-13 12-13s11 5 12 13" fill="#3d2b1f" />
                    {/* hair top spikes */}
                    <path d="M19 11l2 5" stroke="#3d2b1f" strokeWidth="3" strokeLinecap="round" />
                    <path d="M24 8l1 5" stroke="#3d2b1f" strokeWidth="3" strokeLinecap="round" />
                    <path d="M30 8l-1 5" stroke="#3d2b1f" strokeWidth="3" strokeLinecap="round" />
                    <path d="M35 11l-2 5" stroke="#3d2b1f" strokeWidth="3" strokeLinecap="round" />
                    {/* eyes */}
                    <ellipse cx="23" cy="25" rx="1.5" ry="1.8" fill="#3d3d3d" />
                    <ellipse cx="33" cy="25" rx="1.5" ry="1.8" fill="#3d3d3d" />
                    {/* eye highlights */}
                    <circle cx="23.8" cy="24.2" r="0.6" fill="white" />
                    <circle cx="33.8" cy="24.2" r="0.6" fill="white" />
                    {/* big smile */}
                    <path
                      d="M23 30q5 3.5 10 0"
                      stroke="#c47a5a"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      fill="none"
                    />
                    {/* cheeks */}
                    <circle cx="20.5" cy="28.5" r="2.2" fill="#f5c0b0" opacity="0.45" />
                    <circle cx="35.5" cy="28.5" r="2.2" fill="#f5c0b0" opacity="0.45" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">小学6年生</p>
                  <p className="text-xs text-muted">都立中高一貫校 受験予定</p>
                </div>
              </div>
              <div
                className="flex-1 rounded-xl p-4 relative"
                style={{ backgroundColor: "#f8f9f8" }}
              >
                <Quote size={16} className="mb-2" style={{ color: "#c8d4cc" }} />
                <p className="text-sm leading-relaxed" style={{ color: "#555d58" }}>
                  ぼくは作文が苦手で、何を書けばいいかいつも迷っていました。塾の先生も「いつでも作文を持ってきていいよ」と言ってくれるけど、他の勉強もあってなかなか見てもらう機会がありませんでした。でもさくぶんゼミだと家で書いてすぐ出せるので、よく書けているところと直したほうがいいところがわかりやすくて、次に何をがんばればいいかがわかるようになりました。最近は自分から「今日も出してみよう」と思えるようになってきて、姉のように合格できるようにがんばりたいです。
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-20 bg-brand-texture">
        <Container maxWidth="2xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3 text-bg">
              よくある質問
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "対象年齢は何歳ですか？",
                a: "小学1年生〜6年生を対象としています。学年に合わせた漢字チェックやアドバイスを行います。",
              },
              {
                q: "手書きの作文でも使えますか？",
                a: "はい、手書きの作文を写真で撮って送れます。AIが文字を読み取ったあと、内容を確認・修正してから添削に進む流れです。",
              },
              {
                q: "音声入力はどう使いますか？",
                a: "作文入力画面のマイクボタンを押して話すだけ。声が文字に変換されます。キーボード入力との切り替えも自由にできます。",
              },
              {
                q: "途中でやめられますか？",
                a: "はい、いつでもキャンセルできます。キャンセル後も期間終了まで利用可能です。",
              },
              {
                q: "初月半額のあとは？",
                a: "2ヶ月目から通常の月額1,980円になります。自動更新のためお手続きは不要です。",
              },
              {
                q: "お支払い方法は？",
                a: "クレジットカードでのお支払いとなります。Stripeによる安全な決済です。",
              },
            ].map((item) => (
              <div
                key={item.q}
                className="rounded-2xl p-5 border shadow-soft bg-white/95 border-white/30"
              >
                <p className="text-sm font-bold mb-2 text-ink">{item.q}</p>
                <p className="text-sm leading-relaxed text-muted">{item.a}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ─── 安心材料 ─── */}
      <section className="py-14 bg-bg">
        <Container maxWidth="3xl">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { icon: <Camera size={18} className="text-brand-dark" />, text: "手書き作文OK" },
              { icon: <Mic size={18} className="text-brand-dark" />, text: "音声入力対応" },
              { icon: <Users size={18} className="text-brand-dark" />, text: "小学生向け" },
              {
                icon: <BarChart3 size={18} className="text-brand-dark" />,
                text: "保護者向け分析つき",
              },
              { icon: <Sparkles size={18} className="text-brand-dark" />, text: "無料体験あり" },
              { icon: <Star size={18} className="text-brand-dark" />, text: "初月990円" },
              {
                icon: <Shield size={18} className="text-brand-dark" />,
                text: "いつでもキャンセル可能",
              },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-2.5 bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-soft"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-accent">
                  {item.icon}
                </div>
                <span className="text-xs font-bold text-ink">{item.text}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-20">
        <Container>
          <div className="rounded-3xl p-10 sm:p-14 text-center relative overflow-hidden bg-accent-texture">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4 relative text-brand-dark">
              まずは1回、無料で始めてみませんか？
            </h2>
            <p className="text-sm sm:text-base mb-8 relative text-brand-dark">
              お子さまの作文を送るだけ。AIがやさしく添削します。
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 text-base font-bold px-8 py-4 rounded-2xl hover:transition-colors active:scale-[0.98] shadow-lg relative bg-brand-dark text-bg"
            >
              無料で始める
              <ChevronRight size={18} />
            </Link>
            <p className="text-xs mt-3 relative text-brand-dark/50">
              クレジットカード不要・1回無料体験つき
            </p>
          </div>
        </Container>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-gray-100 py-10 bg-brand-dark">
        <Container>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-brand-dark">
                <Pen size={14} stroke="white" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-bold text-bg">さくぶんゼミ</span>
            </div>
            <div className="flex items-center gap-5">
              <Link href="/terms" className="text-xs transition-colors text-bg/80">
                利用規約
              </Link>
              <Link href="/privacy" className="text-xs transition-colors text-bg/80">
                プライバシーポリシー
              </Link>
              <Link href="/legal" className="text-xs transition-colors text-bg/80">
                特定商取引法
              </Link>
            </div>
          </div>
          <p className="text-center text-xs mt-6 text-bg/50">&copy; 2026 さくぶんゼミ</p>
        </Container>
      </footer>
    </div>
  );
}

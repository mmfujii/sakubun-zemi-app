import { z } from "zod";

export const FeedbackScoreSchema = z.object({
  score: z.number(),
  comment: z.string(),
});

export const FocusPointSchema = z.object({
  point: z.string(),
  how: z.string(),
});

export const GrammarNoteSchema = z.object({
  original: z.string(),
  suggestion: z.string(),
  reason: z.string(),
});

export const IssueBreakdownSchema = z.object({
  totalCount: z.number(),
  shownToChild: z.number(),
  categories: z.record(z.string(), z.number()),
});

export const SubmissionDetailSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  rawText: z.string(),
  createdAt: z.string(), // ISO8601
  score: z.number(),
  scores: z.object({
    taskAlignment: FeedbackScoreSchema,
    logic: FeedbackScoreSchema,
    expression: FeedbackScoreSchema,
    originality: FeedbackScoreSchema,
  }),
  child: z.object({
    praise: z.array(z.string()),
    focusPoints: z.array(FocusPointSchema),
    nextStep: z.string(),
  }),
  parent: z.object({
    summary: z.string(),
    issueBreakdown: IssueBreakdownSchema,
    whyThese: z.string(),
    homeAdvice: z.string(),
  }),
  grammarNotes: z.array(GrammarNoteSchema),
  kanjiNotes: z.array(z.string()),
});

// 初回表示用の軽い版（保護者分析は /submissions/:id/parent で別取得）
export const SubmissionSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  rawText: z.string(),
  createdAt: z.string(),
  score: z.number(),
  child: z.object({
    praise: z.array(z.string()),
    focusPoints: z.array(FocusPointSchema),
    nextStep: z.string(),
  }),
});

export type FeedbackScore = z.infer<typeof FeedbackScoreSchema>;
export type FocusPoint = z.infer<typeof FocusPointSchema>;
export type GrammarNote = z.infer<typeof GrammarNoteSchema>;
export type IssueBreakdown = z.infer<typeof IssueBreakdownSchema>;
export type SubmissionDetail = z.infer<typeof SubmissionDetailSchema>;
export type SubmissionSummary = z.infer<typeof SubmissionSummarySchema>;

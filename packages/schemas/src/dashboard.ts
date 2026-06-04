import { z } from "zod";

export const DashboardSubmissionSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string(), // ISO8601
  score: z.number(),
});

export const DashboardSummarySchema = z.object({
  userName: z.string(),
  totalCount: z.number(),
  avgScore: z.number().nullable(),
  scoreTrend: z.object({ diff: z.number() }).nullable(),
  recentSubmissions: z.array(DashboardSubmissionSchema),
});

export type DashboardSubmission = z.infer<typeof DashboardSubmissionSchema>;
export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;

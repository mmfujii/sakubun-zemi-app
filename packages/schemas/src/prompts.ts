import { z } from "zod";

export const PromptSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  category: z.string().nullable(),
});

export const PromptsResponseSchema = z.object({
  prompts: z.array(PromptSchema),
});

export type Prompt = z.infer<typeof PromptSchema>;
export type PromptsResponse = z.infer<typeof PromptsResponseSchema>;

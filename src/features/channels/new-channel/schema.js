import { z } from "zod";

export const newChannelSchema = z.object({
  name: z.string().trim().min(1, "Channel name is required").max(60),
  handle: z
    .string()
    .trim()
    .min(3, "Handle must be at least 3 characters")
    .max(30)
    .regex(/^[a-z0-9_]+$/i, "Letters, numbers and underscores only"),
  description: z.string().trim().max(280).optional().or(z.literal("")),
});

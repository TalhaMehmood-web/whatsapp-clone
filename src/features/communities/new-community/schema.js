import { z } from "zod";

export const newCommunitySchema = z.object({
  name: z.string().trim().min(1, "Community name is required").max(60),
  description: z.string().trim().max(280).optional().or(z.literal("")),
});

import { z } from "zod";

// Handle uses the same shape as /u/{handle} for symmetry: lowercase
// alphanumeric + dot/underscore, 3–30 chars. Optional — communities
// without a handle can't be invite-linked but still work internally.
export const newCommunitySchema = z.object({
  name: z.string().trim().min(1, "Community name is required").max(60),
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9_.]{3,30}$/,
      "3–30 chars: lowercase letters, numbers, dot or underscore.",
    )
    .optional()
    .or(z.literal("")),
  description: z.string().trim().max(280).optional().or(z.literal("")),
});

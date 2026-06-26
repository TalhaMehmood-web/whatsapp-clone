import { z } from "zod";

export const newGroupSchema = z.object({
  name: z.string().trim().min(1, "Group name is required").max(60),
  memberIds: z
    .array(z.string())
    .min(1, "Select at least one member")
    .max(256),
});

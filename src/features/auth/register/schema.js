import { z } from "zod";

const phoneRegex = /^\+?[0-9 ()-]{7,20}$/;
const handleRegex = /^[a-z0-9_.]{3,24}$/i;

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(60),
    handle: z
      .string()
      .trim()
      .regex(
        handleRegex,
        "Username can be 3–24 letters, numbers, dot or underscore",
      ),
    email: z
      .string()
      .trim()
      .email("Invalid email")
      .optional()
      .or(z.literal("")),
    phone: z
      .string()
      .trim()
      .regex(phoneRegex, "Invalid phone")
      .optional()
      .or(z.literal("")),
    password: z.string().min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => !!(data.email || data.phone), {
    message: "Email or phone is required",
    path: ["email"],
  });

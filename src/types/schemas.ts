// src/types/schemas.ts
import { z } from "zod";

export const MovementInputSchema = z.object({
  type: z.enum(["IN", "OUT", "TRANSFER", "ADJUST"]),
  itemId: z.string(),
  lotId: z.string().optional(),
  qty: z.number().positive(),
  reason: z.string().optional(),
});

export type MovementInput = z.infer<typeof MovementInputSchema>;

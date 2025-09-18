import { z } from "zod";

export const MovementInputSchema = z.object({
  type: z.enum(["IN", "OUT", "ADJUST", "TRANSFER"]),
  itemId: z.string().min(1, "itemId required"),
  lotId: z.string().optional(),
  qty: z.number().int().positive("qty must be positive"),
  reason: z.string().optional(),
});
export type MovementInput = z.infer<typeof MovementInputSchema>;

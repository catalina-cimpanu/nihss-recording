import type { z } from "zod";
import {
  erhebungStatusSchema,
  hemianopsieSeiteSchema,
  lyseStatusSchema,
  seiteSchema,
  strokeStatusSchema,
  untersuchungstypSchema,
} from "@/lib/nihss/validation";

export type Untersuchungstyp = z.infer<typeof untersuchungstypSchema>;
export type ErhebungStatus = z.infer<typeof erhebungStatusSchema>;
export type StrokeStatus = z.infer<typeof strokeStatusSchema>;
export type LyseStatus = z.infer<typeof lyseStatusSchema>;
export type Seite = z.infer<typeof seiteSchema>;
export type HemianopsieSeite = z.infer<typeof hemianopsieSeiteSchema>;

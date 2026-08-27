import { z } from "zod";

export const untersuchungstypSchema = z.enum(["Test", "Echter Patient"]);

export const erhebungStatusSchema = z.enum([
  "offen",
  "abgeschlossen",
  "geloescht",
]);

export const strokeStatusSchema = z.enum([
  "nicht entschieden",
  "Ja",
  "Kein Stroke",
]);

export const lyseStatusSchema = z.enum([
  "nicht entschieden",
  "Ja",
  "Keine Lyse",
]);

export const seiteSchema = z.enum(["links", "rechts"]);

export const hemianopsieSeiteSchema = z.enum(["links", "rechts", "beidseits"]);

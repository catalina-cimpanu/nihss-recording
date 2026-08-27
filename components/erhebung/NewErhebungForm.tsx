"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import OptionButton from "@/components/erhebung/OptionButton";
import optionStyles from "@/components/nihss_items/nihssOptions.module.css";
import { createErhebung } from "@/lib/db/erhebungen";
import { isSupabaseConfigured } from "@/lib/env";
import type { NihssOption } from "@/lib/nihss/config";
import { untersuchungstypSchema } from "@/lib/nihss/validation";
import { createErhebungsId } from "@/lib/time/berlin";
import type { Untersuchungstyp } from "@/lib/nihss/types";

const UNTERSUCHUNGSTYP_OPTIONS: NihssOption[] = [
  { value: "Test", label: "Test", score: null, color: "stroke" },
  {
    value: "Echter Patient",
    label: "Echter Patient",
    score: null,
    color: "stroke",
  },
];

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Die Erhebung konnte nicht erstellt werden. Bitte erneut versuchen.";
}

export default function NewErhebungForm() {
  const router = useRouter();
  const [untersuchungstyp, setUntersuchungstyp] =
    useState<Untersuchungstyp | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsedType = untersuchungstypSchema.safeParse(untersuchungstyp);
    if (!parsedType.success) {
      setError("Bitte wählen Sie einen Untersuchungstyp.");
      return;
    }

    if (!isSupabaseConfigured()) {
      setError(
        "Supabase ist nicht konfiguriert. Bitte .env.local prüfen und den Dev-Server neu starten.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await createErhebung({
        erhebungs_id: createErhebungsId(),
        untersuchungstyp: parsedType.data,
      });
      router.push(`/records/${created.id}`);
      router.refresh();
    } catch (caught) {
      setError(errorMessage(caught));
      setIsSubmitting(false);
    }
  }

  const frameClass = untersuchungstyp
    ? optionStyles.fieldFrameSide
    : optionStyles.fieldFrameEmpty;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className={`space-y-2 ${optionStyles.fieldFrame} ${frameClass}`}>
        <h2 className="text-sm font-semibold">Untersuchungstyp</h2>
        <div className="flex flex-col gap-2" role="radiogroup" aria-label="Untersuchungstyp">
          {UNTERSUCHUNGSTYP_OPTIONS.map((option) => (
            <OptionButton
              key={option.value}
              option={option}
              selected={untersuchungstyp === option.value}
              onSelect={() =>
                setUntersuchungstyp(option.value as Untersuchungstyp)
              }
            />
          ))}
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-tempis-signal/30 bg-surface px-3 py-2 text-sm text-tempis-signal">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-tempis-blue-dark px-4 py-3 font-semibold text-white hover:bg-tempis-blue-darker disabled:bg-tempis-dusty disabled:text-white sm:w-auto"
      >
        {isSubmitting ? "Erhebung wird erstellt…" : "Erhebung erstellen"}
      </button>
    </form>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createErhebung } from "@/lib/db/erhebungen";
import { isSupabaseConfigured } from "@/lib/env";
import { untersuchungstypSchema } from "@/lib/nihss/validation";
import { createErhebungsId } from "@/lib/time/berlin";
import type { Untersuchungstyp } from "@/lib/nihss/types";

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Untersuchungstyp</legend>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="radio"
            name="untersuchungstyp"
            value="Test"
            checked={untersuchungstyp === "Test"}
            onChange={() => setUntersuchungstyp("Test")}
          />
          Test
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="radio"
            name="untersuchungstyp"
            value="Echter Patient"
            checked={untersuchungstyp === "Echter Patient"}
            onChange={() => setUntersuchungstyp("Echter Patient")}
          />
          Echter Patient
        </label>
      </fieldset>

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

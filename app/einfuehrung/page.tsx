import Link from "next/link";
import PageShell from "@/components/PageShell";

export default function EinfuehrungPage() {
  return (
    <PageShell title="Einführung">
      <p className="text-sm text-muted">
        Diese App dient der schnellen NIHSS-Dokumentation während eines
        TEMPiS-Videokonsils. Es werden keine patientenidentifizierenden Daten
        erfasst. Zeitpunkte der Klicks werden für spätere Zeitanalysen
        gespeichert.
      </p>

      <section className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold">Bitte beachten</h2>
        <ol className="list-decimal space-y-3 pl-5 text-sm">
          <li>
            Bei der Untersuchung bitte die{" "}
            <strong>vorgegebene Reihenfolge</strong> der Fragen einhalten.
          </li>
          <li>
            Da Zeitanalysen durchgeführt werden sollen, bitte auf{" "}
            <strong>präzise Aktivierung der kritischen Buttons</strong>
            {" "}achten (v.&nbsp;a. Untersuchung starten, Stroke-Entscheidung,
            Lyse-Entscheidung, Untersuchung beenden).
          </li>
          <li>
            <strong>
              Die Untersuchungsdauer darf die Anamnese nicht beinhalten!
            </strong>{" "}
            D.&nbsp;h. „Untersuchung starten“ erst dann klicken, wenn man
            tatsächlich mit der NIHSS-Untersuchung beginnt.
          </li>
          <li>
            Wichtig: Bei den in der App abgefragten Entscheidungen zu Stroke /
            Lyse geht es um rein{" "}
            <strong>hypothetische Entscheidungen</strong>, bei denen allein der
            erhobene klinische Befund entscheidend ist —{" "}
            <strong>
              ungeachtet aller Begleitumstände einschließlich Kontraindikationen
            </strong>.
          </li>
          <li>
            Wenn vergessen wurde, die Lyse- und/oder Stroke-Entscheidung während
            der Untersuchung zum richtigen Zeitpunkt anzuklicken, kann diese
            nachträglich manuell festgelegt werden.
          </li>
        </ol>
      </section>

      <section
        id="kurzanleitung"
        className="space-y-3 rounded-xl border border-border bg-surface p-4"
      >
        <h2 className="text-lg font-semibold">Kurzanleitung</h2>
        <ol className="list-decimal space-y-3 pl-5 text-sm">
          <li>
            <strong>Erhebung erstellen.</strong> Unter Neue Erhebung wählen Sie
            Test oder Echter Patient. Optional Solo-Patienten-ID (nur Ziffern)
            angeben oder überspringen.
          </li>
          <li>
            <strong>Untersuchung starten.</strong> Sobald das Videokonsil läuft
            und Sie mit der NIHSS beginnen:{" "}
            <strong>Untersuchung starten</strong> oder das erste NIHSS-Item
            antippen. Danach die Fragen in der vorgegebenen Reihenfolge
            beantworten.
          </li>
          <li>
            <strong>Stroke und Lyse während der Untersuchung.</strong> Die
            Buttons oben sind hypothetisch, nur nach Klinik. Sobald Sie
            entscheiden würden: sofort klicken (wichtig für die Zeiten Start →
            Stroke und Stroke → Lyse). Kontraindikationen und die spätere
            TEMPiS-Empfehlung spielen hier keine Rolle.
          </li>
          <li>
            <strong>Untersuchung beenden.</strong> Es folgen, falls nötig,
            Hinweise zu fehlenden Feldern, dann hypothetische Stroke/Lyse{" "}
            <em>nach</em> vollständigem NIHSS, dann die Bestätigung. Die
            NIHSS-Angaben sind danach nur noch lesbar. Die Popups zeigen{" "}
            <strong>Schritt x von y</strong>.
          </li>
          <li>
            <strong>Angaben zum Konsil.</strong> TEMPiS-Verdacht und
            -Empfehlung, Kontraindikationen, Umstände. Bei den
            Kontraindikationen geben Sie an, ob vor der Untersuchung bereits
            welche bekannt waren: <strong>Nein</strong>, oder{" "}
            <strong>Ja</strong>, um die Gründe auszuwählen.{" "}
            Die <strong>Zeiten</strong> (Start, Ende, Stroke, Lyse) sind mit
            Ende der Untersuchung abgeschlossen. Über{" "}
            <strong>Zeiten nachträglich korrigieren</strong> lassen sich die
            Uhrzeiten und die Stroke-/Lyse-Entscheidungen korrigieren oder
            nachtragen; die geklickten Werte bleiben gespeichert.{" "}
            <strong>Speichern</strong> lässt die Felder auf der
            Erhebungsseite änderbar. <strong>Abschließen</strong> sperrt sie.
            Danach öffnet{" "}
            <strong>Angaben zum Konsil nachträglich korrigieren</strong> die
            Felder wieder. Die NIHSS-Angaben bleiben gesperrt.
          </li>
          <li>
            <strong>Liste, Dashboard, CSV.</strong> Unter Erhebungen finden und
            öffnen Sie Fälle (Suche und Filter nach Test/Patient und Status).
            Das Dashboard zeigt Kennzahlen nur für echte Patienten. CSV:
            Untersuchungen exportiert alle Erhebungen; das Klickprotokoll einer
            einzelnen Untersuchung laden Sie in der Erhebung.
          </li>
        </ol>
      </section>

      <section className="space-y-2 rounded-xl border border-tempis-orange bg-tempis-ice p-4">
        <h2 className="text-lg font-semibold">Beispiel</h2>
        <p className="text-sm">
          Aus dem Ersttelefonat weiß man, dass der Pat. eine OAK einnimmt,
          weshalb von vornherein eine Lyse ausgeschlossen ist. Zudem hat der
          Pat. eine bekannte Epilepsie und zu Symptombeginn gekrampft.
        </p>
        <p className="text-sm">
          Man startet das Videokonsil mit der NIHSS-Untersuchung (anhand der
          App). Schon während der Untersuchung der ersten beiden Items stellt
          man ein Absinken im Arm rechts und eine mäßiggradige Aphasie fest. Die
          Klinik ist passend zu einem Schlaganfallverdacht, und man würde
          aufgrund des klinischen Befundes lysieren. Daher klickt man in der App
          sofort auf <strong>Stroke Ja</strong> und <strong>Lyse Ja</strong>,
          bevor man mit den nächsten Items fortfährt.
        </p>
        <p className="text-sm">
          Die bestehende Lyse-Kontraindikation und die tatsächliche
          TEMPiS-Diagnose und -Empfehlung sind hierbei irrelevant.
        </p>
      </section>

      <Link
        href="/new"
        className="inline-flex rounded-lg bg-tempis-blue-dark px-4 py-3 font-semibold text-white hover:bg-tempis-blue-darker"
      >
        Neue Erhebung
      </Link>
    </PageShell>
  );
}

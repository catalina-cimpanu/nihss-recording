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
            Bei der Untersuchung bitte die vorgegebene Reihenfolge der Fragen
            einhalten.
          </li>
          <li>
            Da Zeitanalysen durchgeführt werden sollen, bitte auf präzise
            Aktivierung der kritischen Buttons achten (v.&nbsp;a.{" "}
            <strong>Untersuchung starten</strong>, Stroke-Entscheidung,
            Lyse-Entscheidung, <strong>Untersuchung beenden</strong>).
          </li>
          <li>
            Der Start der Untersuchung in der App entspricht nicht automatischdem Beginn des
            Videokonsils (sobald die Videoverbindung hergestellt ist), sondern dem Start der Untersuchung. Eine
            etwaige Erhebung oder Vervollständigung der Anamnese erfolgt erst
            nach Beendigung der Untersuchung.
          </li>
          <li>
            Wichtig: Bei den in der App abgefragten Entscheidungen zu Stroke /
            Lyse geht es um rein hypothetische Entscheidungen, bei denen allein
            der erhobene klinische Befund entscheidend ist — ungeachtet aller
            Begleitumstände einschließlich Kontraindikationen.
          </li>
          <li>
            Vor dem Beenden wird zuerst auf fehlende NIHSS-Felder hingewiesen,
            falls nötig. Danach erscheint das Fenster zur hypothetischen
            Stroke-/Lyse-Entscheidung: bitte Stroke und Lyse noch einmal{" "}
            <strong className="underline">nach</strong> vollständiger
            NIHSS-Erhebung angeben — ebenfalls hypothetisch, nur anhand des
            klinischen Befunds. Diese Angabe wird getrennt von den Klicks
            während der Untersuchung gespeichert. Danach bestätigen Sie{" "}
            <strong>Untersuchung beenden</strong>. Die NIHSS-Angaben sind dann
            nur noch lesbar.
          </li>
          <li>
            Anschließend erscheinen die Angaben zum Konsil. Mit{" "}
            <strong>Nur speichern</strong> bleiben sie auf der Erhebungsseite
            änderbar. Mit <strong>Erhebung speichern und abschließen</strong>{" "}
            (oder dem gleichnamigen Button auf der Seite) werden die
            Konsilangaben gesperrt.
          </li>
          <li>
            Wird Lyse vor Stroke dokumentiert, muss gewählt werden: verklickt
            (Lyse zurücksetzen) oder beide gleichzeitig (Stroke → Lyse als 0
            Sek.).
          </li>
          <li>
            Bei Kontraindikationen nach der Untersuchung kann{" "}
            <strong>Keine</strong> gewählt werden, wenn keine weiteren bekannt
            geworden sind.
          </li>
          <li>
            Nach <strong>Erhebung erstellen</strong> können Solo-Patienten-ID
            (nur Ziffern) und eine bekannte Lyse-Kontraindikation vor der
            Untersuchung angegeben oder übersprungen werden. Übersprungene
            Angaben lassen sich am Ende nachtragen.
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

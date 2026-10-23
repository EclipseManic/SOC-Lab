import { cn } from "@/lib/utils";

const evidenceBoundaries = [
  {
    scope: "Cross-segment",
    value: "Suricata can see it",
    note: "Attacker-to-victim and victim-to-cloud flows cross the gateway, so the network record has something to say.",
    tone: "text-teal",
  },
  {
    scope: "Same-subnet",
    value: "Suricata cannot",
    note: "Victim-to-victim movement never reaches the sensor. Host telemetry has to carry that part of the story.",
    tone: "text-amber",
  },
  {
    scope: "Offline",
    value: "No direct signal",
    note: "Cracking happens outside the wire. Correlate adjacent events; do not invent a packet.",
    tone: "text-rose",
  },
];

export function SignalReveal() {
  return (
    <section
      id="boundary"
      aria-labelledby="boundary-heading"
      className="relative border-b border-line/60 py-20 sm:py-28"
    >
      <div className="container-page">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-teal">
            Interlude / The boundary
          </span>
          <span className="h-px flex-1 bg-line/80" aria-hidden="true" />
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
            After the attack
          </span>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-16">
          <div>
            <h2
              id="boundary-heading"
              className="max-w-xl text-balance text-4xl font-semibold leading-[0.98] tracking-[-0.045em] text-ink sm:text-5xl"
            >
              The wire can only testify to what crossed it.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted">
              Before the attack can be investigated, the record has to name its
              own limits. These three boundaries decide what counts as evidence.
            </p>
          </div>

          <div className="border-t border-line/80">
            {evidenceBoundaries.map((row) => (
              <div
                key={row.scope}
                className="grid gap-2 border-b border-line/70 py-5 sm:grid-cols-[0.62fr_0.8fr_1.2fr] sm:items-baseline sm:gap-6"
              >
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
                  {row.scope}
                </p>
                <p className={cn("text-sm font-medium", row.tone)}>{row.value}</p>
                <p className="text-sm leading-6 text-muted">{row.note}</p>
              </div>
            ))}
            <p className="mt-5 max-w-xl text-xs leading-5 text-faint">
              No attack or alert screenshots are published until redaction
              review is complete. The absence is part of the record, not a
              design accident.
            </p>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-5 border-t border-line/60 pt-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-faint">
              Next / Act IV
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-ink">
              The signal.
            </p>
            <p className="mt-1 max-w-md text-sm leading-6 text-muted">
              The boundary is set. The capability matrix starts here.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-amber/30 bg-amber/10 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-amber">
            <span className="h-1.5 w-1.5 rounded-full bg-amber" aria-hidden="true" />
            Boundary
          </span>
        </div>
      </div>
    </section>
  );
}

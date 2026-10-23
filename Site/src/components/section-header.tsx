import { ArrowUpRight, BookOpen } from "lucide-react";
import { repoBlob } from "@/data";
import { useLens } from "@/context/lens-context";

interface SectionHeaderProps {
  chapter: {
    readonly n: string;
    readonly id: string;
    readonly title: string;
    readonly promise: string;
    readonly lens: {
      readonly executive: string;
      readonly technical: string;
      readonly hiring: string;
    };
    readonly proof: string;
  };
}

export function SectionHeader({ chapter }: SectionHeaderProps) {
  const { lens, label } = useLens();
  const firstProof = chapter.proof.split(" · ")[0];

  return (
    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
      <div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-teal">
            Chapter {chapter.n}
          </span>
          <span className="h-px flex-1 bg-line/80" aria-hidden="true" />
        </div>
        <h2
          id={`${chapter.id}-heading`}
          className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.035em] text-ink sm:text-4xl"
        >
          {chapter.title}
        </h2>
        <p className="mt-3 max-w-xl text-base leading-7 text-muted">
          {chapter.promise}
        </p>
        <a
          href={`${repoBlob}/${firstProof}`}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-faint transition hover:text-teal"
        >
          <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
          Source record
          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
        </a>
      </div>

      <div className="rounded-2xl border border-line/80 bg-panel/55 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-teal" aria-hidden="true" />
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
            Reading as {label}
          </span>
        </div>
        <p className="mt-2.5 text-sm leading-6 text-muted">{chapter.lens[lens]}</p>
      </div>
    </div>
  );
}

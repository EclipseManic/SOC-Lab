import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Maximize2, ExternalLink, Image as ImageIcon } from "lucide-react";

interface DiagramCardProps {
  title: string;
  subtitle: string;
  src: string;
  aspect?: string;
  caption?: string;
}

export function DiagramCard({ title, subtitle, src, caption }: DiagramCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="group relative cursor-pointer overflow-hidden rounded-xl border border-rule bg-paper-2/80 p-3 transition-all duration-300 hover:border-accent/60 hover:shadow-glow-accent"
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-paper-3">
          <img
            src={src}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-paper-1/90 via-paper-1/30 to-transparent opacity-80 transition-opacity group-hover:opacity-60" />
          
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            <div>
              <span className="chip border-accent/40 bg-paper-1/90 font-mono text-[0.65rem] text-accent">
                4K Master Blueprint
              </span>
              <h4 className="mt-1 text-sm font-medium text-ink">{title}</h4>
              <p className="text-xs text-muted line-clamp-1">{subtitle}</p>
            </div>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rule bg-paper-1/90 text-accent transition-transform duration-300 group-hover:scale-110">
              <Maximize2 className="h-4 w-4" />
            </span>
          </div>
        </div>

        {caption && (
          <p className="mt-2 text-xs text-faint line-clamp-1">
            {caption}
          </p>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[92vh] p-4 sm:p-6 bg-paper-1 border-rule-2">
          <DialogHeader className="pr-12">
            <div className="flex items-center gap-2">
              <span className="chip border-accent/40 bg-accent-soft font-mono text-[0.65rem] text-accent">
                <ImageIcon className="h-3 w-3 inline mr-1" />
                4K UHD Architecture Blueprint
              </span>
            </div>
            <DialogTitle className="text-lg sm:text-2xl mt-1 text-ink">{title}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted">
              {subtitle}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 relative max-h-[72vh] overflow-auto rounded-lg border border-rule bg-paper-3 p-1">
            <img
              src={src}
              alt={title}
              className="w-full h-auto rounded shadow-2xl"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
            <span>{caption || "Authoritative forensic diagram from 06-Resources/diagrams/."}</span>
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-accent hover:text-ink transition-colors"
            >
              Open Raw 4K Image in New Tab
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Maximize2, ExternalLink, Image as ImageIcon } from "lucide-react";

interface DiagramCardProps {
  title: string;
  subtitle: string;
  src: string;
  caption?: string;
}

export function DiagramCard({ title, subtitle, src, caption }: DiagramCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="group relative flex flex-col justify-between cursor-pointer rounded-xl border border-rule bg-paper-2/90 p-4 transition-all duration-300 hover:border-accent/60 hover:shadow-glow-accent"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        aria-label={`View full 4K blueprint: ${title}`}
      >
        {/* 1. Header (Completely above image - NO overlapping) */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="chip border-accent/40 bg-accent-soft font-mono text-[0.65rem] text-accent">
                <ImageIcon className="h-3 w-3 inline mr-1" />
                4K Master Blueprint
              </span>
            </div>
            <h4 className="mt-1.5 text-base font-medium text-ink group-hover:text-accent transition-colors">
              {title}
            </h4>
            <p className="mt-0.5 text-xs text-muted line-clamp-2">{subtitle}</p>
          </div>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rule bg-paper-3 text-muted transition-all duration-300 group-hover:scale-105 group-hover:border-accent group-hover:text-accent">
            <Maximize2 className="h-4 w-4" />
          </span>
        </div>

        {/* 2. Image Container (Clean, NO text overlay, 100% natural aspect ratio, NO cropping) */}
        <div className="relative w-full overflow-hidden rounded-lg border border-rule/80 bg-paper-3/90 flex items-center justify-center p-2 min-h-48">
          <img
            src={src}
            alt={title}
            loading="lazy"
            className="w-full h-auto max-h-72 object-contain rounded transition-transform duration-300 group-hover:scale-[1.01]"
          />
          {/* Subtle hover pill indicating click to enlarge */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-paper-1/40 backdrop-blur-[1px]">
            <span className="chip border-accent/60 bg-paper-1/95 text-xs text-accent font-medium shadow-lg">
              <Maximize2 className="h-3.5 w-3.5 mr-1.5 inline" />
              Click to view full 4K diagram
            </span>
          </div>
        </div>

        {/* 3. Footer Caption (Completely below image - NO overlapping) */}
        {caption && (
          <p className="mt-3 text-xs text-faint line-clamp-2">
            {caption}
          </p>
        )}
      </div>

      {/* 4. Full-Screen Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-7xl w-[96vw] max-h-[94vh] p-5 sm:p-7 bg-paper-1 border-rule-2 flex flex-col">
          <DialogHeader className="pr-12 shrink-0">
            <div className="flex items-center gap-2">
              <span className="chip border-accent/40 bg-accent-soft font-mono text-[0.65rem] text-accent">
                <ImageIcon className="h-3 w-3 inline mr-1" />
                4K UHD Architecture Blueprint
              </span>
            </div>
            <DialogTitle className="text-lg sm:text-2xl mt-1.5 text-ink">{title}</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted">
              {subtitle}
            </DialogDescription>
          </DialogHeader>

          {/* Modal Image Area: Scrollable / Viewable without distortion */}
          <div className="mt-4 relative flex-1 min-h-0 overflow-auto rounded-lg border border-rule bg-paper-3 p-2 flex items-center justify-center">
            <img
              src={src}
              alt={title}
              className="max-w-full max-h-[72vh] w-auto h-auto object-contain rounded shadow-2xl mx-auto"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted shrink-0">
            <span>{caption || "Authoritative forensic diagram from 06-Resources/diagrams/."}</span>
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary text-xs py-1.5 px-3"
            >
              Open Full 4K in New Tab
              <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { Badge } from "@/components/ui/badge";
import type { StageStatus } from "@/data";

const toneByStatus: Record<
  StageStatus,
  "teal" | "blue" | "amber" | "rose" | "neutral"
> = {
  Detected: "teal",
  "Logging gap": "amber",
  "Detection gap": "rose",
  "Rule failure": "blue",
  "Not tested": "neutral",
};

export function StatusBadge({ status }: { status: StageStatus }) {
  return <Badge tone={toneByStatus[status]}>{status}</Badge>;
}

import { ClinicFindings } from "@/components/analysis/clinic-findings";
import type { Finding, Modality } from "@/lib/dentaai/types";

export function FindingsPanel({
  modality,
  findings,
  withheldCount = 0,
}: {
  modality: Modality;
  findings: Finding[];
  forcedTab?: "ai" | "report";
  withheldCount?: number;
  variant?: "default" | "workstation";
}) {
  return <ClinicFindings modality={modality} findings={findings} withheldCount={withheldCount} />;
}

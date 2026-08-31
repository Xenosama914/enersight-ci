import { Badge } from "@/components/ui/badge";
import { SEVERITY_LABELS } from "@/lib/constants";
import type { Priority, Severity } from "@/types";

const severityVariant: Record<Severity, React.ComponentProps<typeof Badge>["variant"]> = {
  low: "muted",
  medium: "warn",
  high: "sevHigh",
  critical: "destructive",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <Badge variant={severityVariant[severity]}>{SEVERITY_LABELS[severity]}</Badge>;
}

const priorityVariant: Record<Priority, React.ComponentProps<typeof Badge>["variant"]> = {
  low: "muted",
  medium: "warn",
  high: "sevHigh",
  urgent: "destructive",
};

const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Faible",
  medium: "Moyenne",
  high: "Haute",
  urgent: "Urgente",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge variant={priorityVariant[priority]}>{PRIORITY_LABELS[priority]}</Badge>;
}

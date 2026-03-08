import Link from "next/link";
import { Badge, modelTierVariant, stateVariant } from "@/components/ui/badge";
import type { Entity, FlowState } from "@/lib/defcon-client";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface EntityCardProps {
  entity: Entity;
  state: FlowState;
}

export function EntityCard({ entity, state }: EntityCardProps) {
  const linear = entity.refs?.linear;
  const enteredAt = entity.history?.findLast((h) => h.toState === entity.state)?.timestamp;

  return (
    <Link href={`/entity/${encodeURIComponent(entity.id)}`} className="block group">
      <div
        className="rounded border p-3 transition-colors"
        style={{
          background: "var(--card)",
          borderColor: "var(--border)",
        }}
      >
        {linear ? (
          <>
            <div className="flex items-start justify-between gap-2 mb-2">
              <span
                className="text-xs font-bold tracking-wider"
                style={{ color: "var(--accent-green)" }}
              >
                {linear.key}
              </span>
              {state.modelTier && (
                <Badge variant={modelTierVariant(state.modelTier)}>{state.modelTier}</Badge>
              )}
            </div>
            <p
              className="text-xs leading-relaxed mb-3 line-clamp-2"
              style={{ color: "var(--foreground)" }}
            >
              {linear.title}
            </p>
          </>
        ) : (
          <div className="mb-2">
            <span className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>
              {entity.id.slice(0, 12)}…
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <Badge variant={stateVariant(entity.state)} dot>
            {entity.state}
          </Badge>
          {enteredAt && (
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              {timeAgo(enteredAt)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

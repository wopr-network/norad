import type { Entity, FlowState } from "@/lib/defcon-client";
import { EntityCard } from "./entity-card";

interface StateColumnProps {
  state: FlowState;
  count: number;
  entities: Entity[];
}

export function StateColumn({ state, count, entities }: StateColumnProps) {
  return (
    <div className="flex flex-col min-w-[220px] max-w-[260px]">
      {/* Column header */}
      <div
        className="flex items-center justify-between px-3 py-2 mb-3 rounded border"
        style={{
          background: "var(--muted)",
          borderColor: "var(--border)",
        }}
      >
        <span
          className="text-xs font-bold tracking-widest uppercase"
          style={{ color: "var(--muted-foreground)" }}
        >
          {state.name}
        </span>
        <span
          className="text-xs font-mono px-1.5 py-0.5 rounded"
          style={{
            background: count > 0 ? "rgba(0,255,136,0.1)" : "var(--card)",
            color: count > 0 ? "var(--accent-green)" : "var(--muted-foreground)",
          }}
        >
          {count}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 flex-1">
        {entities.map((entity) => (
          <EntityCard key={entity.id} entity={entity} state={state} />
        ))}
        {entities.length === 0 && (
          <div
            className="text-xs text-center py-6 rounded border border-dashed"
            style={{ color: "var(--muted-foreground)", borderColor: "var(--border)" }}
          >
            empty
          </div>
        )}
      </div>
    </div>
  );
}

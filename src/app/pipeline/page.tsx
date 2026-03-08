import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import type { Entity } from "@/lib/defcon-client";
import { getDefconStatus, getEntitiesByState, getFlows } from "@/lib/defcon-client";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  let flows = [] as Awaited<ReturnType<typeof getFlows>>;
  let counts = {} as Record<string, Record<string, number>>;
  const entityMap: Record<string, Entity[]> = {};

  try {
    [flows, { flows: counts }] = await Promise.all([getFlows(), getDefconStatus()]);
    await Promise.all(
      flows.flatMap((flow) =>
        flow.states.map(async (state) => {
          const key = `${flow.id}::${state.name}`;
          try {
            entityMap[key] = await getEntitiesByState(flow.name, state.name);
          } catch {
            entityMap[key] = [];
          }
        }),
      ),
    );
  } catch {
    // render empty board on error — client will retry via polling
  }

  return (
    <div>
      <div className="px-6 pt-5 pb-0 flex items-center gap-3">
        <h1
          className="text-sm font-bold tracking-[0.3em] uppercase"
          style={{ color: "var(--foreground)" }}
        >
          Pipeline
        </h1>
        <span className="text-xs tracking-wider" style={{ color: "var(--muted-foreground)" }}>
          / entity board
        </span>
      </div>
      <PipelineBoard initial={{ flows, entityMap, counts }} />
    </div>
  );
}

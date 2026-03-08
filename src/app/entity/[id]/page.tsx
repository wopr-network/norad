import Link from "next/link";
import { notFound } from "next/navigation";
import { ArtifactsPanel } from "@/components/entity/artifacts-panel";
import { EntityTimeline } from "@/components/entity/entity-timeline";
import { Badge, stateVariant } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getEntity } from "@/lib/defcon-client";

export const dynamic = "force-dynamic";

interface EntityPageProps {
  params: Promise<{ id: string }>;
}

export default async function EntityPage({ params }: EntityPageProps) {
  const { id } = await params;

  let entity: Awaited<ReturnType<typeof getEntity>>;
  try {
    entity = await getEntity(id);
  } catch {
    notFound();
  }

  const linear = entity.refs?.linear;
  const github = entity.refs?.github;

  return (
    <div className="max-w-4xl mx-auto px-6 py-6">
      {/* Back */}
      <Link
        href="/pipeline"
        className="inline-flex items-center gap-1.5 text-xs mb-6 transition-opacity hover:opacity-70"
        style={{ color: "var(--muted-foreground)" }}
      >
        ← Pipeline
      </Link>

      {/* Header */}
      <div className="mb-6">
        {linear && (
          <div
            className="text-xs font-bold tracking-widest uppercase mb-1"
            style={{ color: "var(--accent-green)" }}
          >
            {linear.key}
          </div>
        )}
        <h1 className="text-lg font-bold mb-3 leading-snug" style={{ color: "var(--foreground)" }}>
          {linear?.title ?? entity.id}
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={stateVariant(entity.state)} dot>
            {entity.state}
          </Badge>
          {github?.repo && (
            <a
              href={`https://github.com/${github.repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs hover:opacity-80 transition-opacity"
              style={{ color: "var(--accent-blue)" }}
            >
              {github.repo}
            </a>
          )}
          {linear && (
            <a
              href={`https://linear.app/issue/${linear.key}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs hover:opacity-80 transition-opacity"
              style={{ color: "var(--accent-blue)" }}
            >
              Linear ↗
            </a>
          )}
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            {entity.id}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Timeline */}
        <Card className="p-4">
          <h2
            className="text-xs font-bold tracking-widest uppercase mb-4"
            style={{ color: "var(--muted-foreground)" }}
          >
            Timeline
          </h2>
          <EntityTimeline history={entity.history ?? []} currentState={entity.state} />
        </Card>

        <div className="flex flex-col gap-6">
          {/* Artifacts */}
          <Card className="p-4">
            <h2
              className="text-xs font-bold tracking-widest uppercase mb-4"
              style={{ color: "var(--muted-foreground)" }}
            >
              Artifacts
            </h2>
            <ArtifactsPanel artifacts={entity.artifacts ?? {}} />
          </Card>

          {/* Metadata */}
          <Card className="p-4">
            <h2
              className="text-xs font-bold tracking-widest uppercase mb-3"
              style={{ color: "var(--muted-foreground)" }}
            >
              Metadata
            </h2>
            <div className="flex flex-col gap-2 text-xs">
              {[
                ["Flow", entity.flowId],
                ["Created", new Date(entity.createdAt).toLocaleString()],
                ["Updated", new Date(entity.updatedAt).toLocaleString()],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-2">
                  <span className="w-16 flex-shrink-0" style={{ color: "var(--muted-foreground)" }}>
                    {label}
                  </span>
                  <span style={{ color: "var(--foreground)" }}>{value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

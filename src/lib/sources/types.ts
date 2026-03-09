export interface CronSourceConfig {
  schedule?: string;
  interval_ms?: number;
}

export interface Source {
  name: string;
  type: "cron";
  config: CronSourceConfig;
}

export interface Watch {
  name: string;
  source: string;
  filter: Record<string, unknown>;
  action: "create_entity";
  action_config: {
    flow: string;
    refs?: Record<string, unknown>;
    artifacts?: Record<string, unknown>;
  };
}

export interface SourcesConfig {
  sources: Record<string, Omit<Source, "name">>;
  watches: Record<string, Omit<Watch, "name">>;
}

export interface CronState {
  sourceName: string;
  lastFiredAt: number | null;
  nextFireAt: number;
}

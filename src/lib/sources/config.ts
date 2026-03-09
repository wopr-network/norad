import { existsSync, readFileSync } from "node:fs";
import { SOURCES_CONFIG_PATH } from "@/lib/config";
import { logger } from "@/lib/logger";
import type { SourcesConfig } from "./types";

const log = logger("sources-config");

export function loadSourcesConfig(): SourcesConfig | null {
  if (!existsSync(SOURCES_CONFIG_PATH)) {
    log.warn(`Sources config not found at ${SOURCES_CONFIG_PATH} — cron scheduler disabled`);
    return null;
  }
  try {
    const raw = readFileSync(SOURCES_CONFIG_PATH, "utf-8");
    return JSON.parse(raw) as SourcesConfig;
  } catch (err) {
    log.error(`Failed to parse sources config at ${SOURCES_CONFIG_PATH}`, err);
    return null;
  }
}

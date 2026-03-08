export function logger(namespace: string) {
  return {
    info: (...args: unknown[]) => console.info(`[${namespace}]`, ...args),
    warn: (...args: unknown[]) => console.warn(`[${namespace}]`, ...args),
    error: (...args: unknown[]) => console.error(`[${namespace}]`, ...args),
  };
}

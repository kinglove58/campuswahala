const allowed = new Set([
  "service",
  "event",
  "requestId",
  "method",
  "endpoint",
  "status",
  "latencyMs",
  "store",
]);
export function logRecord(fields: Record<string, unknown>): string {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    ...Object.fromEntries(
      Object.entries(fields).filter(([k]) => allowed.has(k)),
    ),
  });
}
export function log(fields: Record<string, unknown>): void {
  console.log(logRecord(fields));
}

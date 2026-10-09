import { randomUUID } from "node:crypto";
export function requestId(): string {
  return randomUUID();
}
export function originAllowed(origin: unknown, expected: string): boolean {
  return origin === expected;
}
export const apiError = (code: string, id: string) => ({
  error: { code, requestId: id },
});

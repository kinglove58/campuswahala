"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AcademicCommand, AcademicView } from "@campuswahala/domain";
export function useAcademics(enabled: boolean) {
  const [state, setState] = useState<AcademicView | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(false);
  // Only a pending in-memory command, retried explicitly with the same key.
  // Never localStorage, service-worker storage or a background mutation queue.
  const pending = useRef<AcademicCommand | null>(null),
    running = useRef(false);
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const current = generation.current;
    if (!enabled) return;
    try {
      const r = await fetch("/api/academic/state", { cache: "no-store" });
      if (!r.ok)
        throw new Error(
          "Academic connection unavailable. Reconnect and retry.",
        );
      const data: AcademicView = await r.json();
      if (generation.current === current) {
        setState((old) => (!old || data.revision >= old.revision ? data : old));
        if (!pending.current) setError("");
      }
    } catch (e) {
      if (generation.current === current)
        setError(
          e instanceof Error ? e.message : "Academic connection unavailable.",
        );
    }
  }, [enabled]);
  useEffect(() => {
    generation.current++;
    if (!enabled) {
      setState(null);
      setError("");
      pending.current = null;
      setRetry(false);
      return;
    }
    void refresh();
    const focus = () => void refresh();
    window.addEventListener("focus", focus);
    window.addEventListener("online", focus);
    const timer = setInterval(focus, 30000);
    return () => {
      generation.current++;
      clearInterval(timer);
      window.removeEventListener("focus", focus);
      window.removeEventListener("online", focus);
    };
  }, [enabled, refresh]);
  const command = useCallback(
    async (intent: AcademicCommand | null) => {
      if (!enabled || running.current) return;
      if (!navigator.onLine) {
        setError(
          "Reconnect before academic actions. No offline credit or queued actions.",
        );
        return;
      }
      const value =
        pending.current ??
        (intent ? { ...intent, commandId: crypto.randomUUID() } : null);
      if (!value) return;
      pending.current = value;
      running.current = true;
      setBusy(true);
      setError("");
      const current = generation.current;
      try {
        const r = await fetch("/api/academic/commands", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(value),
          signal: AbortSignal.timeout(20000),
        });
        const data = await r.json();
        if (generation.current !== current) return;
        if (!r.ok) {
          if (r.status >= 500)
            throw new Error(
              "Response uncertain. Retry the same academic command.",
            );
          pending.current = null;
          setRetry(false);
          setError(
            `Academic action declined: ${data.error?.code ?? "UNAVAILABLE"}. Refresh to see valid actions.`,
          );
          void refresh();
          return;
        }
        pending.current = null;
        setRetry(false);
        setState((old) =>
          !old || data.state.revision >= old.revision ? data.state : old,
        );
      } catch {
        if (generation.current === current) {
          setRetry(true);
          setError(
            "Connection interrupted. Retry pending academic command to check its receipt.",
          );
        }
      } finally {
        running.current = false;
        setBusy(false);
      }
    },
    [enabled, refresh],
  );
  return { state, busy, error, retry, refresh, command };
}

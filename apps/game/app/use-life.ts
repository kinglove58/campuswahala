"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { readPrivate } from "./read-private";
import type { LifeCommand, LifeView } from "@campuswahala/domain";
export function useLife(enabled: boolean) {
  const [state, setState] = useState<LifeView | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(false);
  const [acknowledgement, setAcknowledgement] = useState<{
    commandId: string;
    type: string;
    termId: string;
  } | null>(null);
  // Only a pending in-memory command, retried explicitly with the same key.
  // Never localStorage, service-worker storage or a background mutation queue.
  const pending = useRef<LifeCommand | null>(null),
    running = useRef(false);
  const generation = useRef(0);
  const readController = useRef<AbortController | null>(null);
  const readAgain = useRef(false);
  const refresh = useCallback(async () => {
    const current = generation.current;
    if (!enabled) return;
    if (readController.current) {
      readAgain.current = true;
      return;
    }
    const controller = new AbortController();
    readController.current = controller;
    try {
      const r = await readPrivate("/api/life/state", controller.signal);
      if (!r.ok)
        throw new Error(
          "Campus life connection unavailable. Reconnect and retry.",
        );
      const data: LifeView = await r.json();
      if (generation.current === current) {
        setState((old) =>
          !old || (data.state?.revision ?? 0) >= (old.state?.revision ?? 0)
            ? data
            : old,
        );
        if (!pending.current) setError("");
      }
    } catch (e) {
      if (generation.current === current)
        setError(
          e instanceof Error
            ? e.message
            : "Campus life connection unavailable.",
        );
    } finally {
      if (readController.current === controller) {
        readController.current = null;
        readAgain.current = false;
        if (readAgain.current) {
          readAgain.current = false;
          void refresh();
        }
      }
    }
  }, [enabled]);
  useEffect(() => {
    generation.current++;
    if (!enabled) {
      setState(null);
      setAcknowledgement(null);
      setError("");
      pending.current = null;
      setRetry(false);
      return;
    }
    void refresh();
    const focus = () => void refresh();
    window.addEventListener("focus", focus);
    window.addEventListener("online", focus);
    return () => {
      generation.current++;
      readController.current?.abort();
      readController.current = null;
      readAgain.current = false;
      window.removeEventListener("focus", focus);
      window.removeEventListener("online", focus);
    };
  }, [enabled, refresh]);
  const command = useCallback(
    async (intent: LifeCommand | null) => {
      if (!enabled || running.current) return;
      if (!navigator.onLine) {
        setError(
          "Reconnect before life actions. No offline credit or queued actions.",
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
        const r = await fetch("/api/life/commands", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(value),
          signal: AbortSignal.timeout(20000),
        });
        const data = await r.json();
        if (generation.current !== current) return;
        if (!r.ok) {
          if (r.status === 429) {
            setRetry(true);
            setError(
              "Campus is busy. Wait a moment, then explicitly retry your pending action.",
            );
            return;
          }
          if (r.status >= 500)
            throw new Error("Response uncertain. Retry the same life command.");
          pending.current = null;
          setRetry(false);
          setError(
            `Campus life action declined: ${data.error?.code ?? "UNAVAILABLE"}. Refresh to see valid actions.`,
          );
          void refresh();
          return;
        }
        pending.current = null;
        setRetry(false);
        setAcknowledgement(data.receipt);
        setState((old) =>
          !old ||
          (data.state.state?.revision ?? 0) >= (old.state?.revision ?? 0)
            ? data.state
            : old,
        );
      } catch {
        if (generation.current === current) {
          setRetry(true);
          setError(
            "Connection interrupted. Retry pending life command to check its receipt.",
          );
        }
      } finally {
        running.current = false;
        setBusy(false);
      }
    },
    [enabled, refresh],
  );
  return { state, busy, error, retry, refresh, command, acknowledgement };
}

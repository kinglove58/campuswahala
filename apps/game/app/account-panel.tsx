"use client";
import { useEffect, useState } from "react";
type Fact = {
  id: string;
  campus: string;
  category: string;
  key: string;
  value: string;
  lastObservedAt: string;
  staleAt: string;
  sources: string[];
};
export function AccountPanel({
  signedIn,
  onEnded,
}: {
  signedIn: boolean;
  onEnded: () => void;
}) {
  const [ageBand, setAgeBand] = useState("unknown");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    if (signedIn)
      void fetch("/api/account/me")
        .then((r) => r.json())
        .then((data) => setAgeBand(data.profile?.ageBand ?? "unknown"));
  }, [signedIn]);
  async function action(path: string, body?: object, method = "POST") {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(
          data.error?.code === "IDENTITY_NOT_CONFIGURED"
            ? "Sign-in is not configured in this preview."
            : "Could not complete that action. Please retry.",
        );
        return;
      }
      if (data.authorizationUrl) {
        window.location.assign(data.authorizationUrl);
        return;
      }
      if (method === "DELETE") {
        onEnded();
        return;
      }
      setMessage("Privacy settings saved.");
    } catch {
      setMessage("Campus is taking a moment. Please retry.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <h3>{signedIn ? "Your private account" : "Save your journey"}</h3>
      <p>
        {signedIn
          ? "Your character and account are private. They cannot be found in search."
          : "Keep exploring as a guest, or sign in to save this character and return to the same world."}
      </p>
      <label>
        Age band{" "}
        <select value={ageBand} onChange={(e) => setAgeBand(e.target.value)}>
          <option value="unknown">Prefer not to say</option>
          <option value="under_18">Under 18</option>
          <option value="18_or_over">18 or over</option>
        </select>
      </label>
      <p className="fixture">
        No date of birth is collected. Unknown age and under-18 accounts use
        stricter privacy defaults. Your age band is private.
      </p>
      {signedIn ? (
        <>
          <button
            disabled={busy}
            onClick={() =>
              void action("/api/account/privacy", {
                ageBand,
                analyticsConsent: false,
              })
            }
          >
            Save privacy settings
          </button>
          <button
            className="secondary"
            disabled={busy}
            onClick={() =>
              void action("/api/account/session", undefined, "DELETE")
            }
          >
            Sign out
          </button>
          <button
            className="secondary"
            disabled={busy}
            onClick={() =>
              deleting
                ? void action("/api/account/me", undefined, "DELETE")
                : setDeleting(true)
            }
          >
            {deleting ? "Confirm account deletion" : "Delete my account"}
          </button>
          {deleting && (
            <p>
              Deletion immediately ends all account sessions. The worker then
              removes your character, identities, settings and feedback. This
              cannot be undone.
            </p>
          )}
        </>
      ) : (
        <>
          <button
            disabled={busy}
            onClick={() => void action("/api/account/begin", { ageBand })}
          >
            Continue to sign in
          </button>
          <p className="fixture">
            Local development uses an explicitly configured demo identity. Entra
            sign-in is enabled only when the deployment is configured.
          </p>
        </>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
export function GuidePanel({ campus }: { campus: string }) {
  const [facts, setFacts] = useState<Fact[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [message, setMessage] = useState(
    "Loading published campus information…",
  );
  const [selected, setSelected] = useState("");
  const [kind, setKind] = useState("correct");
  const [correction, setCorrection] = useState("");
  useEffect(() => {
    void fetch(`/api/guide?campus=${encodeURIComponent(campus)}&limit=100`)
      .then((r) => r.json())
      .then((data) => {
        const visible = (data.facts ?? []).filter(
          (f: Fact) =>
            f.campus === campus && new Date(f.staleAt).getTime() > Date.now(),
        );
        setFacts(visible);
        setCursor(data.nextCursor ?? null);
        setMessage(
          visible.length
            ? ""
            : "Published campus information is not available yet. The world map remains a fictional preview.",
        );
      })
      .catch(() => setMessage("The guide is temporarily unavailable."));
  }, [campus]);
  async function more() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const r = await fetch(
        `/api/guide?campus=${encodeURIComponent(campus)}&limit=100&cursor=${encodeURIComponent(cursor)}`,
      );
      if (!r.ok) throw Error();
      const data = await r.json();
      setFacts((old) => [
        ...old,
        ...(data.facts ?? []).filter(
          (f: Fact) =>
            f.campus === campus &&
            new Date(f.staleAt).getTime() > Date.now() &&
            !old.some((o) => o.id === f.id),
        ),
      ]);
      setCursor(data.nextCursor ?? null);
    } catch {
      setMessage("More campus information could not be loaded. Please retry.");
    } finally {
      setLoadingMore(false);
    }
  }
  async function feedback() {
    try {
      const r = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          factId: selected,
          kind,
          ...(correction ? { correction } : {}),
        }),
      });
      setMessage(
        r.ok
          ? "Feedback received. It will inform source checks without immediately changing the guide."
          : "Feedback could not be sent. Please retry.",
      );
    } catch {
      setMessage("Feedback is temporarily unavailable.");
    }
  }
  return (
    <section>
      <h3>Campus guide</h3>
      <p className="fixture">
        Verified campus information · Game geometry is an approximate
        representation.
      </p>
      {facts.map((f) => (
        <article key={f.id}>
          <b>{f.key.replaceAll(".", " · ").replaceAll("-", " ")}</b>
          <small>{f.category.replaceAll("_", " ")}</small>
          <p>{f.value}</p>
          <small>
            Last observed {new Date(f.lastObservedAt).toLocaleDateString()}
          </small>
          {f.sources.map((url) => (
            <p key={url}>
              <a href={url} target="_blank" rel="noreferrer">
                View source
              </a>
            </p>
          ))}
        </article>
      ))}
      {cursor && (
        <button disabled={loadingMore} onClick={() => void more()}>
          {loadingMore ? "Opening more places…" : "More campus information"}
        </button>
      )}
      {facts.length > 0 && (
        <>
          <h3>Send feedback</h3>
          <label>
            Fact{" "}
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">Choose a fact</option>
              {facts.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.key}: {f.value}
                </option>
              ))}
            </select>
          </label>
          <label>
            Feedback{" "}
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              {[
                "correct",
                "incorrect",
                "outdated",
                "closed",
                "wrong_location",
                "suggest_correction",
              ].map((k) => (
                <option key={k} value={k}>
                  {k.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label>
            Suggested correction{" "}
            <input
              maxLength={240}
              value={correction}
              onChange={(e) => setCorrection(e.target.value)}
            />
          </label>
          <button disabled={!selected} onClick={() => void feedback()}>
            Send feedback
          </button>
        </>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}

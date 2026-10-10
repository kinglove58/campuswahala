"use client";
import type { LifeCommand, LifeView } from "@campuswahala/domain";
export function LifePanel({
  view,
  busy,
  online,
  error,
  retry,
  onCommand,
  onRefresh,
  venueId,
  authoritativeVenueId,
  homeName,
}: {
  view: LifeView | null;
  busy: boolean;
  online: boolean;
  error: string;
  retry: boolean;
  onCommand: (c: LifeCommand | null) => void;
  onRefresh: () => void;
  venueId?: string;
  authoritativeVenueId?: string;
  homeName?: string;
}) {
  const state = view?.state;
  const label = (c: LifeCommand) => {
    if (c.type === "START_LIFE") return "Begin campus life";
    if (c.type === "RESOLVE_WAHALA") {
      const x = view?.pending?.template.choices.find(
        (x) => x.id === c.choiceId,
      );
      return `${x?.label} · ${x?.minutes} min`;
    }
    const option = state?.policy.options.find((x) => x.id === c.optionId);
    return option?.kind === "EAT"
      ? `${option.label} · ${option.minutes} min`
      : option?.label;
  };
  return (
    <section className="life-panel" aria-label="Private campus life">
      <p className="fixture">
        CampusWahala life simulation · Private game state. Wellbeing is a game
        metric, not medical health.
      </p>
      {!online && (
        <p role="alert">
          Reconnect before life actions. No offline actions are queued.
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      {!view ? (
        <>
          <p role="status">Opening campus life…</p>
          <button disabled={busy || !online} onClick={onRefresh}>
            Retry life connection
          </button>
        </>
      ) : (
        <>
          {state ? (
            <>
              <h3>Your campus day</h3>
              <div className="life-metrics">
                {(["energy", "satiety", "mood", "wellbeing"] as const).map(
                  (key) => (
                    <label key={key}>
                      <span>
                        {key[0]!.toUpperCase() + key.slice(1)} ·{" "}
                        {(state.metrics[key] / 100).toFixed(0)}%
                      </span>
                      <meter
                        aria-label={key}
                        value={state.metrics[key]}
                        min={0}
                        max={10000}
                      />
                    </label>
                  ),
                )}
              </div>
              <p>
                Virtual home: {homeName ?? "simulation residence"} · simulation
                housing. Time passes only when you play; days away never drain
                your stats.
              </p>
              <small>
                Life policy v{state.policy.version} · revision {state.revision}
              </small>
            </>
          ) : (
            <p>
              Start a simulation semester in Portal, then begin your campus
              routine. Guest exploration has no durable life stats.
            </p>
          )}
          <button disabled={busy || !online} onClick={onRefresh}>
            Refresh campus life
          </button>
          {venueId && (
            <p>
              Map movement is cosmetic. Confirm server travel before life
              activities here.
            </p>
          )}
          {view.pending && (
            <article className="wahala-story" role="status">
              <p className="tag">
                A little campus Wahala · fictional situation
              </p>
              <h3>{view.pending.template.title}</h3>
              <p>{view.pending.template.situation}</p>
              <p>
                Choices below consume the stated game time. You may keep
                playing; this situation expires.
              </p>
            </article>
          )}
          <div className="life-actions">
            {view.allowedActions
              .filter(() => !venueId || venueId === authoritativeVenueId)
              .map((c) => (
                <button
                  key={JSON.stringify(c)}
                  disabled={busy || !online || retry}
                  onClick={() => onCommand(c)}
                >
                  {label(c)}
                </button>
              ))}
          </div>
          {view.recent.some((h) => h.status !== "pending") && (
            <details>
              <summary>Recent campus stories</summary>
              {view.recent
                .filter((h) => h.status !== "pending")
                .map((h) => (
                  <p key={h.id}>
                    {h.template.title} · {h.status}
                    {h.chosenChoiceId
                      ? ` · ${h.template.choices.find((c) => c.id === h.chosenChoiceId)?.label}`
                      : ""}
                  </p>
                ))}
            </details>
          )}
        </>
      )}
      {retry && (
        <button disabled={busy || !online} onClick={() => onCommand(null)}>
          Retry pending life command
        </button>
      )}
    </section>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  campuses,
  getCampus,
  type CampusPack,
} from "@campuswahala/campus-content";
import type { GuestInput, GuestPlayer } from "@campuswahala/domain";
import { AccountPanel, GuidePanel } from "./account-panel";
type JourneyPlayer = Omit<GuestPlayer, "expiresAt"> & { expiresAt?: string };
const CampusWorld = dynamic(() => import("./world"), {
  ssr: false,
  loading: () => (
    <div className="world-loading" role="status">
      Building your little world…
    </div>
  ),
});
function campusDefaults(pack: CampusPack) {
  const programme = pack.programmes[0]!;
  return {
    campusId: pack.id,
    programmeId: programme.id,
    level: programme.levels[0]!,
    durationYears: programme.typicalDuration,
  };
}
const initial: GuestInput = {
  ...campusDefaults(campuses[0]!),
  avatar: "lime",
  nickname: "Campus Explorer",
};
type PhoneApp =
  | "home"
  | "map"
  | "schedule"
  | "profile"
  | "account"
  | "guide"
  | "inventory"
  | "notifications";
export default function GuestJourney() {
  const [input, setInput] = useState<GuestInput>(initial);
  const [step, setStep] = useState(0);
  const [player, setPlayer] = useState<JourneyPlayer | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState(false);
  const [phoneApp, setPhoneApp] = useState<PhoneApp>("home");
  const [nearby, setNearby] = useState<CampusPack["locations"][number] | null>(
    null,
  );
  const [interaction, setInteraction] = useState<
    CampusPack["locations"][number] | null
  >(null);
  const phoneTrigger = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const campus = getCampus(player?.campusId ?? input.campusId)!;
  const programme = campus.programmes.find((p) => p.id === input.programmeId)!;
  useEffect(() => {
    const selected = new URLSearchParams(window.location.search).get("campus");
    const pack = getCampus(selected ?? "");
    if (pack) setInput((v) => ({ ...v, ...campusDefaults(pack) }));
    const controller = new AbortController();
    void (async () => {
      const account = await fetch("/api/account/me", {
        signal: controller.signal,
      });
      if (account.ok) {
        const data = await account.json();
        setSignedIn(true);
        const conversion = await fetch("/api/account/convert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
          signal: controller.signal,
        });
        const converted = conversion.ok ? await conversion.json() : null;
        const saved = converted?.character ?? data.character;
        if (saved) {
          setPlayer(saved);
          return null;
        }
      }
      return fetch("/api/guest", { signal: controller.signal });
    })()
      .then(async (r) => {
        if (!r) return;
        if (r.ok) setPlayer(await r.json());
        else if (r.status !== 401)
          setError(
            "Campus is taking a moment. Check that the API is running, then try again.",
          );
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          setError(
            "Could not reach campus. You can retry when your connection returns.",
          );
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!phone) return;
    const dialog = dialogRef.current;
    const first = dialog?.querySelector<HTMLElement>("button");
    first?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setPhone(false);
        phoneTrigger.current?.focus();
      }
      if (e.key === "Tab" && dialog) {
        const nodes = Array.from(
          dialog.querySelectorAll<HTMLElement>('button,a,[tabindex="0"]'),
        );
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [phone, phoneApp]);
  async function start() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!r.ok)
        throw new Error(
          r.status === 429
            ? "Too many attempts. Take a moment, then try again."
            : "Could not enter campus. Check your connection and that the API is running.",
        );
      setPlayer(await r.json());
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function leave() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/guest", { method: "DELETE" });
      if (!r.ok) throw new Error("Could not end the session. Please retry.");
      setPlayer(null);
      setStep(0);
      setPhone(false);
      setInteraction(null);
      setNearby(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please retry.");
    } finally {
      setBusy(false);
    }
  }
  if (loading)
    return (
      <main className="onboarding loading" role="status">
        <span className="brand">CampusWahala ✳</span>
        <h2>Finding your chapter…</h2>
      </main>
    );
  if (!player)
    return (
      <div className="entry">
        <header className="entry-nav">
          <a
            href={process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}
            className="brand"
          >
            Campus<span>Wahala</span> ✳
          </a>
          <span className="tag">GUEST EXPLORATION</span>
        </header>
        <main className="onboarding">
          <aside>
            <p className="eyebrow">YOUR STORY STARTS HERE</p>
            <h1>
              New campus.
              <br />
              New chapter.
              <br />
              <em>Your rules.</em>
            </h1>
            <p>
              No matter your level, there’s a place for you.
              <br />
              Let’s find your starting point.
            </p>
            <div className="entry-illustration" aria-hidden="true">
              ♣ ▥ ⌂
              <span>
                One little world.
                <br />
                So much possibility.
              </span>
            </div>
            <small>
              Phase 0 preview · Sample programmes and fictional maps
            </small>
          </aside>
          <section className="onboarding-card">
            <div className="step-track" aria-label={`Step ${step + 1} of 3`}>
              {["Campus", "Academics", "Character"].map((label, i) => (
                <span className={i <= step ? "active" : ""} key={label}>
                  <b>{i + 1}</b>
                  {label}
                </span>
              ))}
            </div>
            {step === 0 && (
              <>
                <p className="eyebrow">01 / FIND YOUR PEOPLE</p>
                <h2>Which campus?</h2>
                <p className="muted">
                  Pick a starting world. You can explore any campus.
                </p>
                <div className="campus-choices">
                  {campuses.map((c) => (
                    <button
                      type="button"
                      aria-pressed={input.campusId === c.id}
                      className={input.campusId === c.id ? "selected" : ""}
                      key={c.id}
                      onClick={() =>
                        setInput({ ...input, ...campusDefaults(c) })
                      }
                    >
                      <span
                        className="campus-symbol"
                        style={{ background: c.color }}
                      >
                        ▥
                      </span>
                      <span>
                        <strong>{c.shortName}</strong>
                        <small>{c.name}</small>
                      </span>
                      <b>{input.campusId === c.id ? "●" : "○"}</b>
                    </button>
                  ))}
                </div>
                <button className="continue" onClick={() => setStep(1)}>
                  Continue to academics ↗
                </button>
              </>
            )}
            {step === 1 && (
              <>
                <p className="eyebrow">02 / YOUR ACADEMIC CHAPTER</p>
                <h2>Where are you now?</h2>
                <p className="fixture">
                  Unverified sample catalogue. These are not official programme
                  details.
                </p>
                <label>
                  Programme
                  <select
                    value={input.programmeId}
                    onChange={(e) => {
                      const p = campus.programmes.find(
                        (p) => p.id === e.target.value,
                      )!;
                      setInput({
                        ...input,
                        programmeId: p.id,
                        durationYears: p.typicalDuration,
                        level: p.levels[0]!,
                      });
                    }}
                  >
                    {campus.programmes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="field-row">
                  <label>
                    Current level
                    <select
                      value={input.level}
                      onChange={(e) =>
                        setInput({ ...input, level: Number(e.target.value) })
                      }
                    >
                      {programme.levels.map((level) => (
                        <option value={level} key={level}>
                          {level}L
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Duration (years)
                    <select
                      value={input.durationYears}
                      onChange={(e) => {
                        const years = Number(e.target.value);
                        setInput({
                          ...input,
                          durationYears: years,
                          level: input.level,
                        });
                      }}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((y) => (
                        <option value={y} key={y}>
                          {y} {y === 1 ? "year" : "years"}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <p className="duration-note">
                  The sample {programme.title.split(" ·")[0]?.toLowerCase()}{" "}
                  programme uses {programme.typicalDuration} years. Is this
                  right for you? Adjust it above.
                </p>
                <div className="form-actions">
                  <button className="secondary" onClick={() => setStep(0)}>
                    ← Back
                  </button>
                  <button onClick={() => setStep(2)}>
                    Create your character ↗
                  </button>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <p className="eyebrow">03 / MAKE AN ENTRANCE</p>
                <h2>Meet your campus self.</h2>
                <div
                  className={`avatar-preview avatar-${input.avatar}`}
                  aria-hidden="true"
                >
                  <span>●</span>
                  <b />
                </div>
                <label>
                  Campus nickname
                  <select
                    value={input.nickname}
                    onChange={(e) =>
                      setInput({
                        ...input,
                        nickname: e.target.value as GuestInput["nickname"],
                      })
                    }
                  >
                    {[
                      "Campus Explorer",
                      "Future Legend",
                      "Quiet Achiever",
                      "Creative Spirit",
                    ].map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <fieldset>
                  <legend>Pick your colour</legend>
                  <div className="avatar-options">
                    {(["lime", "clay", "blue"] as const).map((color) => (
                      <button
                        className={`swatch swatch-${color}`}
                        aria-label={`${color} avatar`}
                        aria-pressed={input.avatar === color}
                        key={color}
                        onClick={() => setInput({ ...input, avatar: color })}
                      >
                        {input.avatar === color ? "✓" : ""}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <p className="fixture">
                  Your temporary guest expires in 24 hours. Explore without
                  creating an account.
                </p>
                <div className="form-actions">
                  <button
                    className="secondary"
                    disabled={busy}
                    onClick={() => setStep(1)}
                  >
                    ← Back
                  </button>
                  <button disabled={busy} onClick={() => void start()}>
                    {busy ? "Entering campus…" : "Start my chapter ↗"}
                  </button>
                </div>
              </>
            )}
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
          </section>
        </main>
      </div>
    );
  const playerProgramme = campus.programmes.find(
    (p) => p.id === player.programmeId,
  );
  return (
    <main className="game-screen">
      <header className="game-hud" aria-hidden={phone || !!interaction}>
        <div>
          <span className="brand">
            Campus<span>Wahala</span> ✳
          </span>
          <span className="hud-divider" />
          <strong>{campus.shortName}</strong>
          <span className="tag">{player.level}L</span>
        </div>
        <button
          className="secondary exit-button"
          disabled={busy}
          onClick={() =>
            signedIn ? (setPhoneApp("account"), setPhone(true)) : void leave()
          }
        >
          {signedIn ? "Account" : busy ? "Ending…" : "End guest session"}
        </button>
      </header>
      <div className="world-wrap" aria-hidden={phone || !!interaction}>
        <CampusWorld
          pack={campus}
          avatar={player.avatar}
          paused={phone || !!interaction}
          onNearby={setNearby}
        />
        <div className="world-caption">
          <span className="eyebrow">
            WELCOME, {player.nickname.toUpperCase()}
          </span>
          <h2>Make yourself at home.</h2>
          <p>Tap a path to walk · Arrow keys / WASD on desktop</p>
        </div>
        <div className="world-status">
          <span>☀ A fresh chapter</span>
          <span>Virtual location only</span>
        </div>
        <div className="world-bottom">
          <span className="fixture world-fixture">
            Fictional map · Unverified fixture content
          </span>
          {nearby && !phone && !interaction && (
            <button onClick={() => setInteraction(nearby)}>
              Explore {nearby.label} ↗
            </button>
          )}
          <button
            className="phone-trigger"
            ref={phoneTrigger}
            onClick={() => {
              setPhoneApp("home");
              setPhone(true);
            }}
            aria-label="Open virtual phone"
          >
            ▣ <span>Phone</span>
            <kbd>Pocket</kbd>
          </button>
        </div>
      </div>
      {error && (
        <p className="game-error error" role="alert">
          {error}
        </p>
      )}
      {interaction && (
        <section
          className="venue-dialog"
          onKeyDown={(event) => {
            if (event.key === "Escape") setInteraction(null);
            if (event.key === "Tab") {
              event.preventDefault();
              event.currentTarget.querySelector("button")?.focus();
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-label={interaction.label}
        >
          <span className="eyebrow">A LITTLE CAMPUS MOMENT</span>
          <h2>{interaction.label}</h2>
          <p>{interaction.description}</p>
          <p className="fixture">
            This is a fictional venue. No resources or rewards change.
          </p>
          <button autoFocus onClick={() => setInteraction(null)}>
            Back to campus
          </button>
        </section>
      )}
      {phone && (
        <div
          className="phone-backdrop"
          onClick={() => {
            setPhone(false);
            phoneTrigger.current?.focus();
          }}
        >
          <section
            className="phone"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="CW Pocket virtual phone"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="phone-top">
              <span>CW POCKET</span>
              <button
                onClick={() => {
                  setPhone(false);
                  phoneTrigger.current?.focus();
                }}
                aria-label="Close phone"
              >
                ×
              </button>
            </div>
            <div className="phone-header">
              <span className="tag">
                {campus.shortName} · {signedIn ? "PRIVATE" : "GUEST"}
              </span>
              <h2>
                {phoneApp === "home"
                  ? "Your campus, in your pocket."
                  : phoneApp.charAt(0).toUpperCase() + phoneApp.slice(1)}
              </h2>
              {phoneApp !== "home" && (
                <button
                  className="phone-back"
                  onClick={() => setPhoneApp("home")}
                >
                  ← All apps
                </button>
              )}
            </div>
            <div className="phone-content">
              {phoneApp === "account" && (
                <AccountPanel
                  signedIn={signedIn}
                  onEnded={() => {
                    try {
                      sessionStorage.removeItem(`cw_world:${campus.id}`);
                    } catch {
                      /* Optional cosmetic cache. */
                    }
                    setSignedIn(false);
                    setPlayer(null);
                    setPhone(false);
                  }}
                />
              )}
              {phoneApp === "guide" && <GuidePanel campus={campus.id} />}
              {phoneApp === "home" && (
                <>
                  <div className="phone-greeting">
                    Hey, {player.nickname}.<br />
                    <small>A new chapter looks good on you.</small>
                  </div>
                  <div className="phone-app-grid">
                    {(
                      [
                        { id: "map", icon: "⌖", name: "Campus map" },
                        { id: "schedule", icon: "▦", name: "Schedule" },
                        { id: "profile", icon: "☺", name: "My chapter" },
                        { id: "account", icon: "◉", name: "Account & privacy" },
                        { id: "guide", icon: "⌕", name: "Guide & feedback" },
                        { id: "inventory", icon: "▧", name: "Inventory" },
                        { id: "notifications", icon: "♧", name: "Updates" },
                      ] as const
                    ).map((a) => (
                      <button
                        key={a.id}
                        aria-label={a.name}
                        onClick={() => setPhoneApp(a.id)}
                      >
                        <span aria-hidden="true">{a.icon}</span>
                        {a.name}
                      </button>
                    ))}
                  </div>
                  <div className="phone-note">
                    <b>One step at a time.</b>
                    <p>
                      Explore the world first. Academics, hustles and
                      friendships are coming in later chapters.
                    </p>
                  </div>
                </>
              )}
              {phoneApp === "map" && (
                <>
                  <div className="phone-map" aria-label="Fictional venue map">
                    {campus.locations.map((l) => (
                      <span
                        key={l.id}
                        style={{
                          left: `${(l.x / 960) * 100}%`,
                          top: `${(l.y / 640) * 100}%`,
                        }}
                      >
                        ●<small>{l.label}</small>
                      </span>
                    ))}
                  </div>
                  <p className="fixture">
                    Stylized fixture geometry, not real navigation.
                  </p>
                  <ul className="phone-list">
                    {campus.locations.map((l) => (
                      <li key={l.id}>
                        {l.label}
                        <span>{l.kind}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {phoneApp === "schedule" && (
                <>
                  <p className="fixture">
                    Example day only · Not a real timetable
                  </p>
                  <ul className="schedule">
                    <li>
                      <span>09:00</span>
                      <div>
                        <b>Discover campus</b>
                        <small>Take a walk around the commons</small>
                      </div>
                    </li>
                    <li>
                      <span>11:00</span>
                      <div>
                        <b>Find the library</b>
                        <small>Your quiet corner awaits</small>
                      </div>
                    </li>
                    <li>
                      <span>13:00</span>
                      <div>
                        <b>A little food break</b>
                        <small>Explore the food corner</small>
                      </div>
                    </li>
                  </ul>
                  <div className="phone-note">
                    Classes and academic progression are planned.
                  </div>
                </>
              )}
              {phoneApp === "profile" && (
                <>
                  <div
                    className={`avatar-preview avatar-${player.avatar}`}
                    aria-hidden="true"
                  >
                    <span>●</span>
                    <b />
                  </div>
                  <h3>{player.nickname}</h3>
                  <dl>
                    <dt>Campus</dt>
                    <dd>{campus.shortName}</dd>
                    <dt>Programme</dt>
                    <dd>{playerProgramme?.title}</dd>
                    <dt>Level</dt>
                    <dd>{player.level}L</dd>
                    <dt>Personal duration</dt>
                    <dd>{player.durationYears} years</dd>
                    <dt>Session</dt>
                    <dd>
                      {signedIn ? (
                        "Saved private character"
                      ) : (
                        <>
                          Temporary guest · expires{" "}
                          {new Date(player.expiresAt ?? "").toLocaleDateString(
                            "en-GB",
                            {
                              timeZone: "Africa/Lagos",
                            },
                          )}
                        </>
                      )}
                    </dd>
                  </dl>
                </>
              )}
              {phoneApp === "inventory" && (
                <>
                  <div className="inventory-item">
                    <span>▣</span>
                    <div>
                      <h3>CW Pocket</h3>
                      <p>Your virtual phone.</p>
                    </div>
                  </div>
                  <p className="fixture">
                    Illustrative starter item. Inventory ownership, battery and
                    item trading are not implemented.
                  </p>
                </>
              )}
              {phoneApp === "notifications" && (
                <div className="phone-note">
                  <b>Welcome to {campus.shortName}!</b>
                  <p>
                    Your guest journey is ready. Tap around the world and find
                    your favourite corner.
                  </p>
                  <small>Gameplay fixture · No real campus alerts</small>
                </div>
              )}
            </div>
            <div className="phone-footer">
              YOUR CAMPUS. YOUR STORY. <span>✳</span>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

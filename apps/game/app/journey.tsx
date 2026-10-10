"use client";
import { useEffect, useState } from "react";
import CampusExperience from "./campus-experience";
import { defaultAppearance, type Appearance } from "@campuswahala/game-engine";
import { AvatarEditor } from "./avatar-editor";
import {
  campuses,
  getCampus,
  type CampusPack,
} from "@campuswahala/campus-content";
import type { GuestInput, GuestPlayer } from "@campuswahala/domain";

type JourneyPlayer = Omit<GuestPlayer, "expiresAt"> & { expiresAt?: string };
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
export default function GuestJourney() {
  const [input, setInput] = useState<GuestInput>(initial);
  const [step, setStep] = useState(0);
  const [player, setPlayer] = useState<JourneyPlayer | null>(null);
  const [conflict, setConflict] = useState<{
    existing: JourneyPlayer;
    guest: JourneyPlayer;
  } | null>(null);
  const [guestMode, setGuestMode] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [appearance, setAppearance] = useState<Appearance>({
    ...defaultAppearance,
  });
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
        const previousGuest = await fetch("/api/guest", {
          signal: controller.signal,
        }).then(async (r) => (r.ok ? r.json() : null));
        const conversion = await fetch("/api/account/convert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
          signal: controller.signal,
        });
        if (conversion.status === 409 && data.character && previousGuest) {
          setConflict({ existing: data.character, guest: previousGuest });
          return null;
        }
        const converted = conversion.ok ? await conversion.json() : null;
        const saved = converted?.character ?? data.character;
        if (saved) {
          if (!data.character && previousGuest) {
            try {
              const cached = sessionStorage.getItem(
                `cw_appearance:${previousGuest.id}`,
              );
              if (cached)
                sessionStorage.setItem(`cw_appearance:${saved.id}`, cached);
            } catch {
              /* Optional cosmetic cache. */
            }
          }
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
      const created = await r.json();
      try {
        sessionStorage.setItem(
          `cw_appearance:${created.id}`,
          JSON.stringify({ ...appearance, top: input.avatar }),
        );
      } catch {
        /* Optional cosmetic guest cache. */
      }
      if (signedIn) {
        const converted = await fetch("/api/account/convert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
        if (converted.status === 409) {
          const account = await fetch("/api/account/me").then((r) => r.json());
          if (account.character)
            setConflict({ existing: account.character, guest: created });
          return;
        }
        if (!converted.ok)
          throw new Error("Your character could not be saved. Please retry.");
        const { character } = await converted.json();
        if (!character)
          throw new Error("Your character could not be saved. Please retry.");
        try {
          sessionStorage.setItem(
            `cw_appearance:${character.id}`,
            JSON.stringify({ ...appearance, top: input.avatar }),
          );
        } catch {
          /* Optional cosmetic cache. */
        }
        setPlayer(character);
      } else setPlayer(created);
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
  if (conflict)
    return (
      <main className="onboarding">
        <span className="brand">CampusWahala ✳</span>
        <h1>We found an existing CampusWahala journey.</h1>
        <p>
          Existing journey: {conflict.existing.nickname} ·{" "}
          {conflict.existing.campusId.toUpperCase()}
        </p>
        <p>
          Current guest: {conflict.guest.nickname} ·{" "}
          {conflict.guest.campusId.toUpperCase()}
        </p>
        <p>
          Your guest journey stays temporary and expires normally. It has not
          replaced your saved character.
        </p>
        <button
          onClick={() => {
            setPlayer(conflict.existing);
            setGuestMode(false);
            setConflict(null);
          }}
        >
          Resume existing journey
        </button>
        <button
          className="secondary"
          onClick={() => {
            setPlayer(conflict.guest);
            setGuestMode(true);
            setConflict(null);
          }}
        >
          Continue exploring current guest journey temporarily
        </button>
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
              Campus world preview · Sample programmes and fictional maps
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
                        onClick={() => {
                          setInput({ ...input, avatar: color });
                          setAppearance({ ...appearance, top: color });
                        }}
                      >
                        {input.avatar === color ? "✓" : ""}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <AvatarEditor
                  value={appearance}
                  onChange={(look) => {
                    setAppearance(look);
                    setInput({ ...input, avatar: look.top });
                  }}
                />
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
  return (
    <CampusExperience
      player={player}
      campus={campus}
      signedIn={signedIn && !guestMode}
      initialAppearance={{
        ...appearance,
        top: player.avatar as Appearance["top"],
      }}
      onGuestExit={() => void leave()}
      onEnded={() => {
        setSignedIn(false);
        setPlayer(null);
        setStep(0);
      }}
    />
  );
}

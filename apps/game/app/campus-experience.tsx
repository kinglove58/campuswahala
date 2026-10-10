"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  validateWorld,
  parseAppearance,
  type Appearance,
  type WorldManifest,
  type Weather,
  type Interaction,
  type SafeLocation,
  defaultDevice,
} from "@campuswahala/game-engine";
import type { GuestPlayer } from "@campuswahala/domain";
import type { CampusPack } from "@campuswahala/campus-content";
import { AccountPanel, GuidePanel } from "./account-panel";
import { AvatarEditor } from "./avatar-editor";
import { CampusSound } from "./sound";
import type { WorldHandle, WorldSnapshot } from "./world";
const CampusWorld = dynamic(() => import("./world"), {
  ssr: false,
  loading: () => (
    <div className="world-loading" role="status">
      Opening your campus…
    </div>
  ),
});
type App =
  | "home"
  | "map"
  | "portal"
  | "schedule"
  | "guide"
  | "profile"
  | "inventory"
  | "updates"
  | "settings"
  | "account";
type VenueInformation = {
  venueId: string;
  name: string;
  verification: "verified-identity" | "fictional";
  factId?: string;
  staleAt?: string;
  sources?: string[];
};
type Player = Omit<GuestPlayer, "expiresAt"> & { expiresAt?: string };
const apps: Array<{ id: App; icon: string; name: string }> = [
  { id: "map", icon: "⌖", name: "Campus map" },
  { id: "portal", icon: "▥", name: "Portal" },
  { id: "schedule", icon: "▦", name: "Schedule" },
  { id: "guide", icon: "⌕", name: "Guide & feedback" },
  { id: "profile", icon: "☺", name: "My chapter" },
  { id: "inventory", icon: "▧", name: "Inventory" },
  { id: "updates", icon: "✳", name: "Updates" },
  { id: "settings", icon: "⚙", name: "Settings" },
  { id: "account", icon: "◉", name: "Account & privacy" },
];
const initialSnapshot: WorldSnapshot = {
  x: 0,
  y: 0,
  zoneId: "",
  nearbyId: null,
  clock: "07:00",
  day: "Monday",
  week: 1,
  hour: 7,
  period: "morning",
  weather: "clear",
  battery: 100,
};
export default function CampusExperience({
  player,
  campus,
  signedIn,
  onEnded,
  onGuestExit,
  initialAppearance,
}: {
  player: Player;
  campus: CampusPack;
  signedIn: boolean;
  onEnded: () => void;
  onGuestExit: () => void;
  initialAppearance: Appearance;
}) {
  const [manifest, setManifest] = useState<WorldManifest | null>(null),
    [safe, setSafe] = useState<SafeLocation | null>(null),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  const [appearance, setAppearance] = useState<Appearance>(initialAppearance),
    [phone, setPhone] = useState(false),
    [app, setApp] = useState<App>("home"),
    [snapshot, setSnapshot] = useState(initialSnapshot),
    [waypoint, setWaypoint] = useState<string | null>(null),
    [interaction, setInteraction] = useState<Interaction | null>(null),
    [weather, setWeather] = useState<Weather | "auto">("auto"),
    [saveMessage, setSaveMessage] = useState(""),
    [volume, setVolume] = useState(0),
    [zoom, setZoom] = useState(1),
    [online, setOnline] = useState(true);
  const [information, setInformation] = useState<VenueInformation[]>([]);
  const handle = useRef<WorldHandle | null>(null),
    phoneTrigger = useRef<HTMLButtonElement>(null),
    dialog = useRef<HTMLElement>(null),
    gameRegion = useRef<HTMLDivElement>(null),
    sound = useRef<CampusSound | null>(null),
    lastSpawn = useRef(""),
    interactionTrigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    sound.current = new CampusSound();
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      sound.current?.close();
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    void (async () => {
      let saved:
        | (SafeLocation & { appearance: Appearance; appearanceSaved: boolean })
        | null = null;
      if (signedIn) {
        const r = await fetch("/api/account/world", {
          signal: controller.signal,
        });
        if (!r.ok)
          throw new Error(
            "Your saved campus could not be loaded. Please retry.",
          );
        saved = await r.json();
      }
      const id = saved?.campusId ?? campus.id;
      const start = performance.now();
      const pointer = await fetch(`/api/world/${id}/latest`, {
        signal: controller.signal,
      });
      if (!pointer.ok) throw new Error("Campus gates are temporarily closed.");
      const latest = await pointer.json();
      const response = await fetch(
        `/api/world/${id}/versions/${latest.version}`,
        { signal: controller.signal, cache: "force-cache" },
      );
      if (!response.ok) throw new Error("Campus gates are temporarily closed.");
      const world = validateWorld(await response.json());
      if (world.campusId !== id)
        throw new Error("Campus gates are temporarily closed.");
      if (cancelled) return;
      performance.measure("cw.manifest_load_ms", {
        start,
        end: performance.now(),
      });
      const spawn =
        world.spawnPoints.find((s) => s.id === saved?.spawnId) ??
        world.spawnPoints.find((s) => s.id === world.defaultSpawnId)!;
      setSafe({
        campusId: world.campusId,
        worldVersion: world.version,
        spawnId: spawn.id,
        zoneId: spawn.zoneId,
      });
      lastSpawn.current = spawn.id;
      let look = saved ? parseAppearance(saved.appearance) : initialAppearance;
      if (!saved?.appearanceSaved) {
        try {
          const cached = sessionStorage.getItem(`cw_appearance:${player.id}`);
          if (cached) look = parseAppearance(JSON.parse(cached));
        } catch {
          /* Optional cosmetic cache only. */
        }
      }
      setAppearance(look);
      if (signedIn && !saved?.appearanceSaved) {
        try {
          const response = await fetch("/api/account/world", {
            method: "POST",
            signal: controller.signal,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              campusId: world.campusId,
              worldVersion: world.version,
              spawnId: spawn.id,
              appearance: look,
            }),
          });
          if (!response.ok)
            setSaveMessage(
              "Your look could not be saved. Use Profile to retry.",
            );
        } catch {
          if (!cancelled)
            setSaveMessage(
              "Your look could not be saved. Use Profile to retry.",
            );
        }
      }
      if (cancelled) return;
      const destination = new URLSearchParams(window.location.search).get(
        "destination",
      );
      if (destination && world.venues.some((v) => v.id === destination))
        setWaypoint(destination);
      setManifest(world);
      setError("");
    })().catch((e) => {
      if (!cancelled && e.name !== "AbortError")
        setError("Campus gates are temporarily closed. Please retry.");
    });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [campus.id, signedIn, attempt, player.id]);
  useEffect(() => {
    if (!manifest) return;
    const controller = new AbortController();
    const refresh = async () => {
      try {
        const r = await fetch(`/api/world/${manifest.campusId}/information`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!r.ok) throw new Error("unavailable");
        const data = await r.json();
        setInformation(data.venues ?? []);
      } catch {
        if (!controller.signal.aborted) setInformation([]);
      }
    };
    void refresh();
    const timer = setInterval(() => void refresh(), 60000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [manifest]);
  const freshInfo = (id: string) =>
    information.find(
      (i) =>
        i.venueId === id &&
        i.verification === "verified-identity" &&
        i.staleAt &&
        new Date(i.staleAt).getTime() > Date.now(),
    );
  const venueName = (id: string) =>
    freshInfo(id)?.name ??
    manifest?.venues.find((v) => v.id === id)?.name ??
    "";
  const names = Object.fromEntries(
    information
      .filter(
        (i) =>
          i.verification === "verified-identity" &&
          i.staleAt &&
          new Date(i.staleAt).getTime() > Date.now(),
      )
      .map((i) => [i.venueId, i.name]),
  );
  const onReady = useCallback((h: WorldHandle) => {
    handle.current = h;
  }, []);
  const onSnapshot = useCallback((s: WorldSnapshot) => setSnapshot(s), []);
  const modalOpen = phone || !!interaction;
  const restoreFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (gameRegion.current) gameRegion.current.inert = modalOpen;
    if (modalOpen)
      restoreFocus.current = phone
        ? phoneTrigger.current
        : interactionTrigger.current;
    else {
      restoreFocus.current?.focus();
      restoreFocus.current = null;
    }
  }, [modalOpen, phone]);
  useEffect(() => {
    if (!modalOpen) return;
    const modal = dialog.current;
    modal?.querySelector<HTMLElement>("button")?.focus();
    const close = () => {
      setPhone(false);
      setInteraction(null);
      (phone ? phoneTrigger : interactionTrigger).current?.focus();
    };
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
      if (e.key === "Tab" && modal) {
        const nodes = Array.from(
          modal.querySelectorAll<HTMLElement>(
            'button:not(:disabled),a[href],input,select,textarea,[tabindex="0"]',
          ),
        ).filter((n) => n.getClientRects().length);
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
  }, [modalOpen, phone, app, interaction]);
  const persist = async (spawnId: string, look = appearance) => {
    if (!manifest) return;
    lastSpawn.current = spawnId;
    if (!signedIn) {
      try {
        sessionStorage.setItem(
          `cw_appearance:${player.id}`,
          JSON.stringify(look),
        );
      } catch {
        /* Storage is optional. */
      }
      return;
    }
    try {
      const r = await fetch("/api/account/world", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campusId: manifest.campusId,
          worldVersion: manifest.version,
          spawnId,
          appearance: look,
        }),
      });
      setSaveMessage(
        r.ok
          ? "Safe return point saved."
          : "Could not save. Your previous safe return point is unchanged.",
      );
    } catch {
      setSaveMessage(
        "Connection interrupted. Your previous safe return point is unchanged.",
      );
    }
  };
  const closePhone = () => {
    setPhone(false);
    phoneTrigger.current?.focus();
  };
  const nearby = manifest?.interactionPoints.find(
      (i) => i.id === snapshot.nearbyId,
    ),
    zone = manifest?.zones.find((z) => z.id === snapshot.zoneId);
  if (!manifest || !safe)
    return (
      <main className="world-loading" role={error ? "alert" : "status"}>
        <span className="brand">CampusWahala ✳</span>
        <h2>{error || `Opening ${campus.shortName}…`}</h2>
        {error && (
          <button onClick={() => setAttempt((v) => v + 1)}>Retry</button>
        )}
      </main>
    );
  const venue = manifest.venues.find((v) => v.id === interaction?.venueId),
    transport = manifest.transportNodes.find(
      (t) => t.id === interaction?.transportId,
    ),
    npc = manifest.npcSpawns.find((n) => n.id === interaction?.npcId);
  const destination = manifest.venues.find((v) => v.id === waypoint);
  return (
    <main className="game-screen">
      <div className="game-region" ref={gameRegion}>
        <header className="game-hud">
          <div>
            <span className="brand">
              Campus<span>Wahala</span> ✳
            </span>
            <strong>{manifest.campusId.toUpperCase()}</strong>
            <span className="tag">{player.level}L</span>
          </div>
          <button
            className="secondary"
            onClick={() =>
              signedIn ? (setApp("account"), setPhone(true)) : onGuestExit()
            }
          >
            {signedIn ? "Account" : "End guest session"}
          </button>
        </header>
        <div className="world-wrap">
          <CampusWorld
            manifest={manifest}
            venueNames={names}
            appearance={appearance}
            spawnId={safe.spawnId}
            paused={modalOpen}
            waypoint={waypoint}
            weather={weather}
            onSnapshot={onSnapshot}
            onReady={onReady}
          />
          <div className="world-caption">
            <span className="eyebrow">
              {zone?.name ?? "Your campus chapter"}
            </span>
            <h2>
              {snapshot.day} · {snapshot.clock}
            </h2>
            <p>
              {snapshot.weather === "rain"
                ? "Rain on campus. Find your favourite shelter."
                : "No rush. Your campus story is just starting."}
            </p>
          </div>
          <div className="world-status">
            <span>
              {snapshot.period} · Week {snapshot.week} · Game time
            </span>
            <span>
              {online
                ? "Virtual navigation"
                : "Connection interrupted · Explore locally"}
            </span>
          </div>
          {destination && (
            <div className="waypoint-banner" role="status">
              ⌖ {venueName(destination.id)}
              <button
                onClick={() => {
                  const s = manifest.spawnPoints.find(
                    (s) => s.id === destination.safeSpawnId,
                  )!;
                  handle.current?.engine.moveTo(s);
                }}
              >
                Walk there
              </button>
              <button
                aria-label="Clear waypoint"
                onClick={() => setWaypoint(null)}
              >
                ×
              </button>
            </div>
          )}
          <div className="world-bottom">
            <span className="fixture world-fixture">
              Compressed campus geography · Fictional map · Not real GPS
            </span>
            {nearby && (
              <button
                ref={interactionTrigger}
                onClick={() => {
                  handle.current?.engine.intent();
                  setInteraction(nearby);
                  if (nearby.venueId) {
                    const v = manifest.venues.find(
                      (v) => v.id === nearby.venueId,
                    )!;
                    void persist(v.safeSpawnId);
                  }
                }}
              >
                {nearby.venueId
                  ? `Enter ${venueName(nearby.venueId)}`
                  : nearby.label}
              </button>
            )}
            <button
              className="phone-trigger"
              ref={phoneTrigger}
              aria-label="Open virtual phone"
              onClick={() => {
                setApp("home");
                setPhone(true);
                sound.current?.play("phone");
              }}
            >
              ▣ <span>Pocket</span>
            </button>
          </div>
        </div>
      </div>
      {interaction && (
        <div className="phone-backdrop venue-backdrop">
          <section
            className="venue-dialog"
            ref={dialog}
            role="dialog"
            aria-modal="true"
            aria-label={venue ? venueName(venue.id) : interaction.label}
          >
            <button
              className="dialog-close"
              onClick={() => {
                setInteraction(null);
                interactionTrigger.current?.focus();
              }}
            >
              Back to campus
            </button>
            <p className="eyebrow">A LITTLE CAMPUS MOMENT</p>
            <h2>{venue ? venueName(venue.id) : interaction.label}</h2>
            {venue && (
              <>
                {venue.presentation === "interior" && (
                  <div
                    className={`mini-interior interior-${venue.type}`}
                    aria-label="Illustrated fictional interior"
                  >
                    <span>▥</span>
                    <span>▤</span>
                    <span>▥</span>
                    <b>⌑</b>
                    <b>⌑</b>
                    <b>⌑</b>
                  </div>
                )}
                <p>{venue.description}</p>
                <p>
                  Game venue:{" "}
                  {venue.hours &&
                  (snapshot.hour < venue.hours[0] ||
                    snapshot.hour >= venue.hours[1])
                    ? "quiet hours"
                    : "open for exploration"}
                </p>
                {venue.presentation === "zone" && (
                  <p>
                    Explore{" "}
                    {manifest.zones.find((z) => z.id === venue.zoneId)?.name}{" "}
                    from this entrance.
                  </p>
                )}
                <p className="fixture">
                  {freshInfo(venue.id)
                    ? "Verified campus identity · Approximate game representation."
                    : "Fictional gameplay venue."}{" "}
                  No official opening hours, resources or rewards.
                </p>
                {freshInfo(venue.id) && (
                  <button
                    onClick={() => {
                      setInteraction(null);
                      setApp("guide");
                      setPhone(true);
                    }}
                  >
                    View identity sources in campus guide
                  </button>
                )}
              </>
            )}
            {npc && (
              <>
                <p className="tag">Fictional {npc.role.replaceAll("_", " ")}</p>
                {npc.dialogue.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </>
            )}
            {transport && (
              <>
                <p>Free virtual shuttle · No money or fare system</p>
                {transport.destinations.map((d) => (
                  <button
                    className="transport-choice"
                    key={d.spawnId}
                    onClick={() => {
                      if (
                        handle.current?.engine.travel(transport.id, d.spawnId)
                      ) {
                        void persist(d.spawnId);
                        setInteraction(null);
                      }
                    }}
                  >
                    {
                      manifest.zones.find(
                        (z) =>
                          z.id ===
                          manifest.spawnPoints.find((s) => s.id === d.spawnId)
                            ?.zoneId,
                      )?.name
                    }
                    <small>
                      {d.virtualMinutes} virtual minutes · Instant preview
                      transition
                    </small>
                  </button>
                ))}
              </>
            )}
            {interaction.command === "VIEW_NOTICE" && (
              <>
                <p>
                  Welcome to {manifest.campusId.toUpperCase()}. Your next little
                  adventure is a walk away.
                </p>
                <p className="fixture">
                  Game announcement. No unverified official notices.
                </p>
                <button
                  onClick={() => {
                    setInteraction(null);
                    setApp("guide");
                    setPhone(true);
                  }}
                >
                  Read published campus guide
                </button>
              </>
            )}
            {saveMessage && <p role="status">{saveMessage}</p>}
          </section>
        </div>
      )}
      {phone && (
        <div className="phone-backdrop" onClick={closePhone}>
          <section
            className="phone pocket-v2"
            ref={dialog}
            role="dialog"
            aria-modal="true"
            aria-label="CW Pocket virtual phone"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="phone-top">
              <span>CW POCKET</span>
              <span aria-label={online ? "Online" : "Offline"}>
                {online ? "▂▄▆" : "—"} · {snapshot.battery}%
              </span>
              <button aria-label="Close phone" onClick={closePhone}>
                ×
              </button>
            </div>
            <div className="phone-header">
              <span className="tag">
                {manifest.campusId.toUpperCase()} ·{" "}
                {signedIn ? "PRIVATE" : "GUEST"}
              </span>
              {app === "home" ? (
                <>
                  <div className="pocket-clock">{snapshot.clock}</div>
                  <p>
                    {snapshot.day} · Week {snapshot.week}{" "}
                    <small>Game time</small>
                  </p>
                </>
              ) : (
                <>
                  <h2>{apps.find((a) => a.id === app)?.name}</h2>
                  <button className="phone-back" onClick={() => setApp("home")}>
                    ← All apps
                  </button>
                </>
              )}
            </div>
            <div className="phone-content">
              {app === "home" && (
                <>
                  <div className="pocket-welcome">
                    <b>Hey, {player.nickname}.</b>
                    <span>Small steps. Plenty stories.</span>
                  </div>
                  <div className="phone-app-grid">
                    {apps.map((a) => (
                      <button
                        key={a.id}
                        aria-label={a.name}
                        onClick={() => setApp(a.id)}
                      >
                        <span aria-hidden="true">{a.icon}</span>
                        {a.name}
                      </button>
                    ))}
                  </div>
                  <button
                    className="pocket-notification"
                    onClick={() => setApp("updates")}
                  >
                    ✳ Welcome to {manifest.campusId.toUpperCase()}
                    <small>Your chapter is ready. Tap to read.</small>
                  </button>
                </>
              )}
              {app === "map" && (
                <>
                  <svg
                    className="pocket-map"
                    viewBox={`0 0 ${manifest.bounds.width} ${manifest.bounds.height}`}
                    role="img"
                    aria-label="Virtual campus map"
                  >
                    <rect width="100%" height="100%" fill="#d8e1bf" />
                    {manifest.zones.map((z, i) => (
                      <g key={z.id}>
                        <rect
                          x={z.x + 8}
                          y={z.y + 8}
                          width={z.width - 16}
                          height={z.height - 16}
                          fill={i % 2 ? "#c4d4ae" : "#e3dbbb"}
                        />
                        <text
                          x={z.x + 35}
                          y={z.y + 70}
                          fontSize="48"
                          fill="#284732"
                        >
                          {z.name}
                        </text>
                      </g>
                    ))}
                    {manifest.roads.map((r) => (
                      <polyline
                        key={r.id}
                        points={r.points.map((p) => `${p.x},${p.y}`).join(" ")}
                        stroke="#a5a18f"
                        strokeWidth={r.width}
                        fill="none"
                      />
                    ))}
                    {manifest.buildings.map((b) => (
                      <rect
                        key={b.id}
                        x={b.x}
                        y={b.y}
                        width={b.width}
                        height={b.height}
                        fill="#a16d4d"
                      />
                    ))}
                    {manifest.transportNodes.map((t) => (
                      <g key={t.id}>
                        <circle cx={t.x} cy={t.y} r="35" fill="#c99345" />
                        <text
                          x={t.x}
                          y={t.y + 12}
                          textAnchor="middle"
                          fontSize="36"
                          fill="#283b30"
                        >
                          S
                        </text>
                      </g>
                    ))}
                    {manifest.venues.map((v) => {
                      const b = manifest.buildings.find(
                        (b) => b.id === v.buildingId,
                      )!;
                      return (
                        <text
                          key={v.id}
                          x={b.x + b.width / 2}
                          y={b.y + b.height + 42}
                          fontSize="30"
                          textAnchor="middle"
                          fill={freshInfo(v.id) ? "#225c42" : "#765e40"}
                        >
                          {freshInfo(v.id) ? "✓ " : "◇ "}
                          {venueName(v.id)}
                        </text>
                      );
                    })}
                    {destination &&
                      (() => {
                        const s = manifest.spawnPoints.find(
                          (s) => s.id === destination.safeSpawnId,
                        )!;
                        return (
                          <circle
                            cx={s.x}
                            cy={s.y}
                            r="65"
                            fill="none"
                            stroke="#a9472e"
                            strokeWidth="18"
                          />
                        );
                      })()}
                    <circle
                      cx={snapshot.x}
                      cy={snapshot.y}
                      r="45"
                      fill="#1d5243"
                      stroke="#fff8e9"
                      strokeWidth="20"
                    />
                  </svg>
                  <p className="fixture">
                    Virtual campus navigation · compressed geography. ✓ Verified
                    identity · ◇ Fictional venue · S Shuttle. All positions are
                    approximate.
                  </p>
                  <p>
                    You are in {zone?.name}.{" "}
                    {destination
                      ? `Destination: ${venueName(destination.id)}`
                      : "Choose a destination."}
                  </p>
                  <div className="destination-list">
                    {manifest.venues.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => {
                          handle.current?.engine.setWaypoint(v.id);
                          setWaypoint(v.id);
                          closePhone();
                        }}
                      >
                        <b>{venueName(v.id)}</b>
                        <small>
                          Set waypoint · {v.type.replaceAll("_", " ")} ·{" "}
                          {freshInfo(v.id)
                            ? "verified identity, approximate map"
                            : "fictional"}
                        </small>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {app === "guide" && <GuidePanel campus={manifest.campusId} />}
              {app === "account" && (
                <AccountPanel
                  signedIn={signedIn}
                  onEnded={() => {
                    handle.current?.engine.dispose();
                    onEnded();
                  }}
                />
              )}
              {app === "portal" && (
                <>
                  <h3>Your student chapter</h3>
                  <dl>
                    <dt>University</dt>
                    <dd>{campus.name}</dd>
                    <dt>Programme</dt>
                    <dd>
                      {
                        campus.programmes.find(
                          (p) => p.id === player.programmeId,
                        )?.title
                      }
                    </dd>
                    <dt>Stage</dt>
                    <dd>{player.level}L</dd>
                    <dt>Semester</dt>
                    <dd>Not selected</dd>
                  </dl>
                  <p className="fixture">
                    Academic choices remain labelled fixtures.
                  </p>
                  <p>Academic simulation coming next.</p>
                </>
              )}
              {app === "schedule" && (
                <>
                  <p className="fixture">
                    Example day only · Not a real timetable
                  </p>
                  <ul className="schedule">
                    {[
                      ["09:00", "Discover campus"],
                      ["11:00", "A quiet study moment"],
                      ["13:00", "Food and a little stroll"],
                    ].map(([time, name]) => (
                      <li key={time}>
                        <span>{time}</span>
                        <div>
                          <b>{name}</b>
                          <small>Demo game schedule</small>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p>
                    Lectures, assignments, events and exams: future systems.
                  </p>
                </>
              )}
              {app === "profile" && (
                <>
                  <h3>{player.nickname}</h3>
                  <p>
                    {player.level}L ·{" "}
                    {signedIn ? "Saved private character" : "Temporary guest"}
                  </p>
                  <AvatarEditor value={appearance} onChange={setAppearance} />
                  <button
                    onClick={() => void persist(lastSpawn.current, appearance)}
                  >
                    {signedIn ? "Save appearance" : "Keep this look"}
                  </button>
                  <p role="status">{saveMessage}</p>
                </>
              )}
              {app === "inventory" && (
                <>
                  <p className="fixture">
                    Cosmetic demo items · No ownership, trading or economic
                    value
                  </p>
                  {["CW Pocket", "Backpack", "Notebook"].map((n) => (
                    <div className="inventory-item" key={n}>
                      <span>▧</span>
                      <h3>{n}</h3>
                    </div>
                  ))}
                </>
              )}
              {app === "updates" && (
                <>
                  <article className="phone-note">
                    <b>Welcome to {manifest.campusId.toUpperCase()}</b>
                    <p>
                      Open Campus map, choose a place and follow your waypoint.
                    </p>
                    <small>Game announcement</small>
                  </article>
                  <article className="phone-note">
                    <b>
                      {signedIn
                        ? "Your account is private"
                        : "Explore first. Sign up later."}
                    </b>
                    <p>
                      {signedIn
                        ? "Your character is not discoverable in search."
                        : "Guest movement stays temporary. No account needed to explore."}
                    </p>
                  </article>
                  <article className="phone-note">
                    <b>Campus information</b>
                    <p>
                      The guide shows only published, current information.
                      Fictional map locations are labelled separately.
                    </p>
                  </article>
                </>
              )}
              {app === "settings" && (
                <>
                  <label>
                    Weather preview
                    <select
                      value={weather}
                      onChange={(e) =>
                        setWeather(e.target.value as Weather | "auto")
                      }
                    >
                      {["auto", "clear", "cloudy", "rain"].map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Camera zoom
                    <input
                      type="range"
                      min=".75"
                      max="1.6"
                      step=".05"
                      value={zoom}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setZoom(v);
                        handle.current?.zoom(v);
                      }}
                    />
                  </label>
                  <label>
                    Sound volume
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step=".1"
                      value={volume}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setVolume(v);
                        sound.current?.setVolume(v);
                        sound.current?.play("notice");
                      }}
                    />
                  </label>
                  <button
                    onClick={() => {
                      setVolume(0);
                      sound.current?.setVolume(0);
                    }}
                  >
                    Mute all sound
                  </button>
                  <p>
                    Respects your device’s reduced-motion preference. No
                    third-party tracking.
                  </p>
                  <p>
                    {defaultDevice.model} · Cosmetic battery, minimum 20%. Your
                    real battery is not measured.
                  </p>
                </>
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

export default function Page() {
  return (
    <main style={{ maxWidth: 700, margin: "15vh auto", padding: 30 }}>
      <p className="eyebrow">CAMPUSWAHALA · ADMIN BOUNDARY</p>
      <h1 style={{ fontSize: 48 }}>Administration is not enabled.</h1>
      <p>
        This application has no privileged operations. Verified identity, MFA,
        permission checks and audit logging must be implemented before
        administration can be activated.
      </p>
      <span className="tag">Phase 1 · locked views</span>
      <ul>
        {[
          "Ingestion observations and transitions",
          "Source policy and fetch failures",
          "Publication decisions and reasons",
          "Contradictory fact versions",
          "Stale facts and recheck schedules",
          "Feedback and abuse signals",
        ].map((view) => (
          <li key={view}>{view} — authenticated access required</li>
        ))}
      </ul>
      <p>
        Routine publication is automated by source policy. Exception overrides
        remain disabled pending verified administrator identity, MFA and audit
        controls.
      </p>
    </main>
  );
}

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
      <span className="tag">Phase 0 scaffold</span>
    </main>
  );
}

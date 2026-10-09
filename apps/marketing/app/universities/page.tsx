import Link from "next/link";
import { campuses } from "@campuswahala/campus-content";
export const metadata = {
  title: "Explore the campuses",
  description:
    "Meet the three starting points for CampusWahala guest exploration.",
  alternates: { canonical: "/universities" },
};
export default function Universities() {
  return (
    <main className="public-page">
      <Link className="brand" href="/">
        CampusWahala ✳
      </Link>
      <p className="eyebrow" style={{ marginTop: 60 }}>
        YOUR STARTING POINT
      </p>
      <h1>
        Three campuses.
        <br />
        Your next chapter.
      </h1>
      <p>
        FUTA, OAU and UNILAG inspire our first worlds. The preview uses
        fictional layouts and sample programmes while verified campus content is
        developed.
      </p>
      <div className="campus-grid">
        {campuses.map((c) => (
          <Link
            className="campus-card campus-card-copy"
            href={`/universities/${c.id}`}
            key={c.id}
          >
            <h2>{c.shortName} ↗</h2>
            <p>{c.name}</p>
            <small>Explore the fixture world</small>
          </Link>
        ))}
      </div>
    </main>
  );
}

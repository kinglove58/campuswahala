import { notFound } from "next/navigation";
import Link from "next/link";
import { campuses, getCampus } from "@campuswahala/campus-content";
export function generateStaticParams() {
  return campuses.map((c) => ({ campus: c.id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ campus: string }>;
}) {
  const c = getCampus((await params).campus);
  if (!c) return {};
  return {
    title: `${c.shortName} — Begin your story`,
    description: `Explore a fictional CampusWahala world inspired by ${c.name}. Guest preview with unverified sample content.`,
    alternates: { canonical: `/universities/${c.id}` },
  };
}
export default async function Campus({
  params,
}: {
  params: Promise<{ campus: string }>;
}) {
  const c = getCampus((await params).campus);
  if (!c) notFound();
  return (
    <main className="public-page">
      <Link href="/universities">← All campuses</Link>
      <p className="eyebrow" style={{ marginTop: 70 }}>
        A CAMPUSWAHALA STARTING WORLD
      </p>
      <h1>
        {c.shortName}.<br />A story of your own.
      </h1>
      <h2>{c.name}</h2>
      <p>
        This guest preview introduces a small stylized world, an avatar and a
        virtual phone. Walk around the library, lecture hall, hostel and student
        commons as fictional game locations.
      </p>
      <p>
        Programme names, durations, schedules and the map are unverified
        gameplay fixtures. They are not official university information or real
        navigation guidance. Verified catalogue and campus knowledge are planned
        for the next phase.
      </p>
      <a
        className="button"
        href={`${process.env.NEXT_PUBLIC_GAME_URL ?? "http://localhost:3001"}?campus=${c.id}`}
      >
        Explore {c.shortName} ↗
      </a>
    </main>
  );
}

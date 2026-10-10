import { notFound } from "next/navigation";
import { publishedFacts, publishedFactPage } from "../../published";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ campus: string }>;
  searchParams: Promise<{ cursor?: string | string[] }>;
}) {
  const { campus } = await params;
  const facts = (await publishedFacts(campus)).filter(
    (f) => f.campus === campus,
  );
  return {
    title: `${campus.toUpperCase()} campus guide`,
    robots: {
      index: facts.length >= 3 && !(await searchParams).cursor,
      follow: true,
    },
    alternates: { canonical: `/guide/${campus}` },
  };
}
export default async function Guide({
  params,
  searchParams,
}: {
  params: Promise<{ campus: string }>;
  searchParams: Promise<{ cursor?: string | string[] }>;
}) {
  const { campus } = await params;
  const { cursor } = await searchParams;
  if (Array.isArray(cursor)) notFound();
  const current = await publishedFactPage(campus, cursor);
  const facts = current.facts.filter((f) => f.campus === campus);
  if (!facts.length) notFound();
  return (
    <main className="public-page">
      <a href="/">CampusWahala</a>
      <h1>{campus.toUpperCase()} campus guide</h1>
      {cursor && (
        <p>
          <a href={`/guide/${campus}`}>First page</a>
        </p>
      )}
      {facts.map((f) => (
        <article key={f.id}>
          <h2>{f.key}</h2>
          <p>{f.value}</p>
          <small>
            Last observed{" "}
            {new Date(f.lastObservedAt).toLocaleDateString("en-GB")}
          </small>
          {f.sources.map((url) => (
            <p key={url}>
              <a href={url} rel="noreferrer">
                Source
              </a>
            </p>
          ))}
        </article>
      ))}
      {current.nextCursor && (
        <p>
          <a
            href={`/guide/${campus}?${new URLSearchParams({ cursor: current.nextCursor })}`}
          >
            More verified campus information
          </a>
        </p>
      )}
    </main>
  );
}

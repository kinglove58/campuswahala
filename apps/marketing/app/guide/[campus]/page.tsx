import { notFound } from "next/navigation";
import { publishedFacts } from "../../published";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ campus: string }>;
}) {
  const { campus } = await params;
  const facts = (await publishedFacts()).filter((f) => f.campus === campus);
  return {
    title: `${campus.toUpperCase()} campus guide`,
    robots: { index: facts.length >= 3, follow: true },
    alternates: { canonical: `/guide/${campus}` },
  };
}
export default async function Guide({
  params,
}: {
  params: Promise<{ campus: string }>;
}) {
  const { campus } = await params;
  const facts = (await publishedFacts()).filter((f) => f.campus === campus);
  if (!facts.length) notFound();
  return (
    <main className="public-page">
      <a href="/">CampusWahala</a>
      <h1>{campus.toUpperCase()} campus guide</h1>
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
    </main>
  );
}

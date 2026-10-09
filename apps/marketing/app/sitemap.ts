import type { MetadataRoute } from "next";
import { publishedFacts } from "./published";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const facts = await publishedFacts();
  const campuses = [...new Set(facts.map((f) => f.campus))].filter(
    (campus) => facts.filter((f) => f.campus === campus).length >= 3,
  );
  return ["/", ...campuses.map((campus) => `/guide/${campus}`)].map((path) => ({
    url: `${origin}${path}`,
    changeFrequency: "monthly",
  }));
}

import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return [
    "/",
    "/universities",
    "/universities/futa",
    "/universities/oau",
    "/universities/unilag",
  ].map((path) => ({ url: `${origin}${path}`, changeFrequency: "monthly" }));
}

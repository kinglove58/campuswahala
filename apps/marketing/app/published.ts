import { localTrustKey, pseudonym, signContext } from "@campuswahala/security";
export interface PublishedFact {
  id: string;
  campus: string;
  category: string;
  key: string;
  value: string;
  lastObservedAt: string;
  sources: string[];
}
/** Server-only fixed read; candidates, raw documents, identities and profiles never enter marketing. */
export async function publishedFacts(): Promise<PublishedFact[]> {
  const local = process.env.APP_ENV === "local";
  const key =
    process.env.BFF_SERVICE_SECRET ?? (local ? localTrustKey : undefined);
  if (
    !key ||
    (!local &&
      (!process.env.API_INTERNAL_URL ||
        key === localTrustKey ||
        key.length < 32))
  )
    return [];
  const path = "/v1/catalogue/published";
  try {
    const response = await fetch(
      `${process.env.API_INTERNAL_URL ?? "http://127.0.0.1:4000"}${path}`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
        headers: {
          "X-CW-Context": signContext(
            {
              client: "campuswahala-marketing-server",
              network: pseudonym("marketing-service", key),
            },
            "GET",
            path,
            "\n",
            key,
          ),
        },
      },
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.facts ?? [];
  } catch {
    return [];
  }
}

import { catalogueQuerySchema } from "@campuswahala/campus-content";
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
export type PublishedPage = {
  facts: PublishedFact[];
  nextCursor: string | null;
};
const empty = (): PublishedPage => ({ facts: [], nextCursor: null });
export async function publishedFactPage(
  campus?: string,
  cursor?: string,
): Promise<PublishedPage> {
  const parsed = catalogueQuerySchema.safeParse({
    ...(campus ? { campus } : {}),
    ...(cursor ? { cursor } : {}),
    limit: 100,
  });
  if (!parsed.success) return empty();
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
    return empty();
  const path = "/v1/catalogue/published";
  try {
    const query = new URLSearchParams({
      limit: "100",
      ...(campus ? { campus } : {}),
      ...(cursor ? { cursor } : {}),
    });
    const response = await fetch(
      `${process.env.API_INTERNAL_URL ?? "http://127.0.0.1:4000"}${path}?${query}`,
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
    if (!response.ok) return empty();
    const data = await response.json();
    return { facts: data.facts ?? [], nextCursor: data.nextCursor ?? null };
  } catch {
    return empty();
  }
}

export async function publishedFacts(
  campus?: string,
): Promise<PublishedFact[]> {
  return (await publishedFactPage(campus)).facts;
}

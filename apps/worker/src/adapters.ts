/** Retrieval remains in SafeFetcher. Adapters only decode bounded public text;
 * they cannot write evidence, assign source authority or publish a fact. */
export type AdapterKind = "html" | "text" | "json";
export type SourceCategory =
  | "university"
  | "faculty"
  | "department"
  | "student_publication"
  | "news"
  | "public_api"
  | "licensed_map"
  | "licensed_geodata"
  | "permitted_transcript"
  | "public_discussion"
  | "public_listing"
  | "official_pdf";
export interface SourceAdapter {
  readonly kind: AdapterKind;
  decode(body: string): string;
}
const html: SourceAdapter = { kind: "html", decode: (body) => body };
const text: SourceAdapter = { kind: "text", decode: (body) => body };
const json: SourceAdapter = {
  kind: "json",
  decode: (body) => {
    const value: unknown = JSON.parse(body);
    if (!value || typeof value !== "object")
      throw new Error("JSON_OBJECT_REQUIRED");
    if (!Array.isArray(value)) return body;
    // Bounded public page-list responses (e.g. official WordPress APIs).
    // Decode rendered text only; IDs/links are not evidence of a place name.
    if (value.length < 1 || value.length > 20)
      throw new Error("JSON_PAGE_LIMIT");
    return value
      .map((page: unknown) => {
        if (!page || typeof page !== "object" || Array.isArray(page))
          throw new Error("JSON_PAGE_REQUIRED");
        const record = page as Record<string, unknown>;
        const rendered = [record.title, record.content].map((field) => {
          if (
            !field ||
            typeof field !== "object" ||
            Array.isArray(field) ||
            typeof (field as Record<string, unknown>).rendered !== "string"
          )
            throw new Error("JSON_RENDERED_TEXT_REQUIRED");
          return (field as { rendered: string }).rendered;
        });
        return rendered.join("\n");
      })
      .join("\n");
  },
};
export function sourceAdapter(contentType: string | undefined): SourceAdapter {
  switch (contentType?.split(";")[0]?.trim()) {
    case "text/html":
      return html;
    case "text/plain":
      return text;
    case "application/json":
      return json;
    default:
      throw new Error("UNSUPPORTED_SOURCE_ADAPTER");
  }
}
/** Map/PDF/media decoders are deliberately disabled until bounded parsing,
 * license/minimization and access policies have executable tests. */
export const deferredAdapters = [
  "official_pdf",
  "licensed_geodata",
  "licensed_map",
  "public_video",
] as const;

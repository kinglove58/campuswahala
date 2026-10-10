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
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error("JSON_OBJECT_REQUIRED");
    return body;
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

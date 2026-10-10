import { it, expect } from "vitest";
import { sourceAdapter } from "../apps/worker/src/adapters";
it("decodes only bounded transport-supported public formats and holds unknown/binary media", () => {
  expect(sourceAdapter("text/html").decode("<h1>Place</h1>")).toBe(
    "<h1>Place</h1>",
  );
  expect(sourceAdapter("text/plain; charset=utf-8").decode("Place")).toBe(
    "Place",
  );
  expect(sourceAdapter("application/json").decode('{"name":"Place"}')).toBe(
    '{"name":"Place"}',
  );
  for (const mime of [
    undefined,
    "application/pdf",
    "video/mp4",
    "application/geo+json",
    "application/octet-stream",
  ])
    expect(() => sourceAdapter(mime)).toThrow();
  for (const invalid of ["{bad", "[]", "null"])
    expect(() => sourceAdapter("application/json").decode(invalid)).toThrow();
});

it("bounds official public page lists and extracts rendered text without URL metadata", () => {
  const api = sourceAdapter("application/json");
  const page = {
    title: { rendered: "Campus" },
    content: { rendered: "<p>Moremi</p>" },
    link: "https://example.test/FalsePlace",
  };
  expect(api.decode(JSON.stringify([page]))).toBe("Campus\n<p>Moremi</p>");
  for (const invalid of [[{}], ["Place"], Array(21).fill(page)])
    expect(() => api.decode(JSON.stringify(invalid))).toThrow();
});

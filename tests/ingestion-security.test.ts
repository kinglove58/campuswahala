import { describe, expect, it } from "vitest";
import {
  OfficialNameExtractor,
  groundedConfidence,
} from "../apps/worker/src/intelligence";
import {
  SafeFetcher,
  publicAddress,
  robotsAllow,
  type FetchTransport,
  type FetchResult,
} from "../apps/worker/src/safe-fetch";
const html: FetchResult = {
  status: 200,
  headers: { "content-type": "text/html" },
  body: "<h1>Campus</h1>",
  url: "https://official.example/",
};
const settings = {
  timeoutMs: 50,
  maxBytes: 100,
  redirects: 2,
  domainIntervalMs: 0,
};
function mock(
  addresses = ["93.184.216.34"],
  responses = [html],
): FetchTransport {
  let calls = 0;
  return {
    resolve: async () => addresses,
    request: async (_url, pinned) => {
      expect(addresses).toContain(pinned);
      return responses[Math.min(calls++, responses.length - 1)]!;
    },
  };
}
describe("deterministic ingestion security without network", () => {
  it("extracts only observed public names and excludes scripts or unrelated JSON metadata", async () => {
    const extractor = new OfficialNameExtractor();
    const context = {
      sourceUrl: "https://official.example/",
      expectedUniversityName: "Obafemi Awolowo University",
    };
    expect(
      await extractor.extract({
        ...context,
        body: "<script>Obafemi Awolowo University</script><p>Other content</p>",
      }),
    ).toEqual([]);
    expect(
      await extractor.extract({
        ...context,
        body: JSON.stringify({ name: "Another institution" }),
      }),
    ).toEqual([]);
    expect(
      await extractor.extract({
        ...context,
        body: JSON.stringify({ name: context.expectedUniversityName }),
      }),
    ).toMatchObject([
      { value: context.expectedUniversityName, locator: "public-json:name" },
    ]);
  });
  it("does not let model confidence establish missing or hidden evidence", () => {
    const candidate = {
      entityType: "critical" as const,
      key: "contact",
      value: "300",
      category: "critical" as const,
      confidence: 1,
      locator: "p",
      excerpt: "300",
    };
    expect(groundedConfidence(candidate, "<p>300</p>")).toBe(0.95);
    expect(groundedConfidence(candidate, "<p>3000</p>")).toBe(0);
    expect(groundedConfidence(candidate, "<script>300</script>")).toBe(0);
    expect(groundedConfidence(candidate, "<p>Different contact</p>")).toBe(0);
  });
  it.each([
    "127.0.0.1",
    "10.0.0.1",
    "172.16.1.1",
    "192.168.1.1",
    "169.254.169.254",
    "168.63.129.16",
    "0.0.0.0",
    "100.64.0.1",
    "224.0.0.1",
    "::1",
    "::",
    "fe80::1",
    "fc00::1",
    "::ffff:127.0.0.1",
    "2001:db8::1",
    "2002:7f00:1::",
  ])("blocks non-public or metadata address %s", (address) => {
    // Azure's platform virtual IP is blocked separately even though globally shaped.
    expect(publicAddress(address)).toBe(false);
  });
  it("pins the validated DNS result and rejects mixed public/private answers", async () => {
    await expect(
      new SafeFetcher(mock(), settings).fetch("https://official.example/", [
        "official.example",
      ]),
    ).resolves.toMatchObject({ status: 200 });
    await expect(
      new SafeFetcher(mock(["93.184.216.34", "127.0.0.1"]), settings).fetch(
        "https://official.example/",
        ["official.example"],
      ),
    ).rejects.toThrow("SSRF_ADDRESS_REJECTED");
  });
  it("rechecks redirects, blocks rebinding, schemes, credentials and encoded localhost", async () => {
    const transport = mock();
    let resolutions = 0;
    transport.resolve = async () =>
      ++resolutions === 1 ? ["93.184.216.34"] : ["169.254.169.254"];
    transport.request = async () => ({
      ...html,
      status: 302,
      headers: { location: "/private" },
    });
    await expect(
      new SafeFetcher(transport, settings).fetch("https://official.example/", [
        "official.example",
      ]),
    ).rejects.toThrow("SSRF_ADDRESS_REJECTED");
    for (const url of [
      "file:///etc/passwd",
      "http://user:pass@official.example",
      "http://0x7f000001",
    ])
      await expect(
        new SafeFetcher(mock(), settings).fetch(url, [
          "official.example",
          "127.0.0.1",
        ]),
      ).rejects.toThrow();
    await expect(
      new SafeFetcher(mock(), settings).fetch("https://other.example", [
        "official.example",
      ]),
    ).rejects.toThrow("URL_POLICY_REJECTED");
  });
  it("bounds redirects, body, MIME, timeout and request pacing", async () => {
    await expect(
      new SafeFetcher(
        mock(undefined, [
          { ...html, status: 302, headers: { location: "/again" } },
        ]),
        settings,
      ).fetch(html.url, ["official.example"]),
    ).rejects.toThrow("REDIRECT_LIMIT");
    await expect(
      new SafeFetcher(
        mock(undefined, [{ ...html, body: "x".repeat(101) }]),
        settings,
      ).fetch(html.url, ["official.example"]),
    ).rejects.toThrow("BODY_TOO_LARGE");
    await expect(
      new SafeFetcher(
        mock(undefined, [
          { ...html, headers: { "content-type": "application/octet-stream" } },
        ]),
        settings,
      ).fetch(html.url, ["official.example"]),
    ).rejects.toThrow("MIME_REJECTED");
    const hanging = mock();
    hanging.request = async () => new Promise(() => {});
    await expect(
      new SafeFetcher(hanging, settings).fetch(html.url, ["official.example"]),
    ).rejects.toThrow("FETCH_TIMEOUT");
    const paced = new SafeFetcher(mock(), {
      ...settings,
      domainIntervalMs: 1000,
    });
    await paced.fetch(html.url, ["official.example"]);
    await expect(paced.fetch(html.url, ["official.example"])).rejects.toThrow(
      "DOMAIN_RATE_LIMITED",
    );
  });
  it("honors matching robots groups, conservative wildcard denies and unsupported syntax", () => {
    expect(robotsAllow("User-agent: *\nDisallow: /private", "/public")).toBe(
      true,
    );
    expect(
      robotsAllow("User-agent: *\nUser-agent: Other\nDisallow: /", "/public"),
    ).toBe(false);
    expect(
      robotsAllow("User-agent: CampusWahalaResearch\nDisallow: /", "/public"),
    ).toBe(false);
    expect(robotsAllow("User-agent: *\nDisallow: /*?", "/public")).toBe(false);
    expect(robotsAllow("invalid", "/")).toBe(false);
  });
});

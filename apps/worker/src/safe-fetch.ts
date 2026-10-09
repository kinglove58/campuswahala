import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import http from "node:http";
import https from "node:https";

const forbidden = new BlockList();
forbidden.addAddress("168.63.129.16", "ipv4");
for (const [ip, bits] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const)
  forbidden.addSubnet(ip, bits, "ipv4");
for (const [ip, bits] of [
  ["2001::", 23],
  ["2001:db8::", 32],
  ["2002::", 16],
] as const)
  forbidden.addSubnet(ip, bits, "ipv6");
const globalV6 = new BlockList();
globalV6.addSubnet("2000::", 3, "ipv6");
export function publicAddress(address: string): boolean {
  const family = isIP(address);
  return family === 4
    ? !forbidden.check(address, "ipv4")
    : family === 6 &&
        globalV6.check(address, "ipv6") &&
        !forbidden.check(address, "ipv6");
}
export interface FetchResult {
  status: number;
  headers: Record<string, string | undefined>;
  body: string;
  url: string;
}
export interface FetchTransport {
  resolve(host: string): Promise<string[]>;
  request(
    url: URL,
    pinnedAddress: string,
    signal: AbortSignal,
    maxBytes: number,
    headers: Record<string, string>,
  ): Promise<FetchResult>;
}
export const nodeTransport: FetchTransport = {
  async resolve(host) {
    return (await lookup(host, { all: true, verbatim: true })).map(
      (a) => a.address,
    );
  },
  request(url, pinnedAddress, signal, maxBytes, headers) {
    return new Promise((resolve, reject) => {
      const connectionOptions = { autoSelectFamily: false };
      const request = (url.protocol === "https:" ? https : http).request(
        url,
        {
          signal,
          agent: false,
          ...connectionOptions,
          headers,
          lookup: (_host, _options, callback) =>
            callback(null, pinnedAddress, isIP(pinnedAddress)),
        },
        (response) => {
          const type = response.headers["content-type"]?.split(";")[0]?.trim();
          const status = response.statusCode ?? 0;
          if (
            status === 200 &&
            !["text/html", "text/plain", "application/json"].includes(
              type ?? "",
            )
          ) {
            response.destroy(new Error("MIME_REJECTED"));
            return;
          }
          if (Number(response.headers["content-length"] ?? 0) > maxBytes) {
            response.destroy(new Error("BODY_TOO_LARGE"));
            return;
          }
          const chunks: Buffer[] = [];
          let bytes = 0;
          response.on("data", (chunk: Buffer) => {
            bytes += chunk.length;
            if (bytes > maxBytes) response.destroy(new Error("BODY_TOO_LARGE"));
            else chunks.push(chunk);
          });
          response.on("error", reject);
          response.on("end", () =>
            resolve({
              status,
              headers: {
                location: response.headers.location,
                "content-type": type,
                etag: response.headers.etag,
                "last-modified": response.headers["last-modified"],
              },
              body: Buffer.concat(chunks).toString("utf8"),
              url: url.href,
            }),
          );
        },
      );
      request.on("error", reject);
      request.end();
    });
  },
};
export class SafeFetcher {
  private readonly last = new Map<string, number>();
  constructor(
    private readonly transport: FetchTransport = nodeTransport,
    private readonly settings = {
      timeoutMs: 10000,
      maxBytes: 262144,
      redirects: 3,
      domainIntervalMs: 1000,
    },
  ) {}
  async fetch(
    input: string,
    allowedDomains: readonly string[],
    conditional: Record<string, string> = {},
  ): Promise<FetchResult> {
    const signal = AbortSignal.timeout(this.settings.timeoutMs);
    const work = async () => {
      let url = new URL(input);
      for (let redirect = 0; redirect <= this.settings.redirects; redirect++) {
        const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
        if (
          !["http:", "https:"].includes(url.protocol) ||
          url.username ||
          url.password ||
          !allowedDomains.includes(host) ||
          (url.port && !["80", "443"].includes(url.port))
        )
          throw new Error("URL_POLICY_REJECTED");
        const addresses = isIP(host)
          ? [host]
          : await this.transport.resolve(host);
        if (!addresses.length || addresses.some((a) => !publicAddress(a)))
          throw new Error("SSRF_ADDRESS_REJECTED");
        if (signal.aborted) throw new Error("FETCH_TIMEOUT");
        const now = Date.now();
        if (now - (this.last.get(host) ?? 0) < this.settings.domainIntervalMs)
          throw new Error("DOMAIN_RATE_LIMITED");
        this.last.set(host, now);
        const response = await this.transport.request(
          url,
          addresses[0]!,
          signal,
          this.settings.maxBytes,
          {
          "User-Agent": "CampusWahalaResearch/1.0 (public-source research)",
            Accept: "text/html,text/plain,application/json",
            ...conditional,
          },
        );
        if (Buffer.byteLength(response.body) > this.settings.maxBytes)
          throw new Error("BODY_TOO_LARGE");
        if ([301, 302, 303, 307, 308].includes(response.status)) {
          if (
            !response.headers.location ||
            redirect === this.settings.redirects
          )
            throw new Error("REDIRECT_LIMIT");
          const next = new URL(response.headers.location, url);
          if (url.protocol === "https:" && next.protocol !== "https:")
            throw new Error("REDIRECT_DOWNGRADE");
          url = next;
          continue;
        }
        if (
          response.status === 200 &&
          !["text/html", "text/plain", "application/json"].includes(
            response.headers["content-type"]?.split(";")[0]?.trim() ?? "",
          )
        )
          throw new Error("MIME_REJECTED");
        return response;
      }
      throw new Error("REDIRECT_LIMIT");
    };
    return new Promise((resolve, reject) => {
      signal.addEventListener(
        "abort",
        () => reject(new Error("FETCH_TIMEOUT")),
        { once: true },
      );
      work().then(resolve, reject);
    });
  }
}
/** Conservative robots parser: every matching deny applies; unknown syntax fails closed. */
export function robotsAllow(text: string, path: string): boolean {
  let agents: string[] = [];
  let rulesStarted = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.split("#")[0]!.trim();
    if (!line) continue;
    const match = /^([a-z-]+)\s*:\s*(.*)$/i.exec(line);
    if (!match) return false;
    const key = match[1]!.toLowerCase(),
      value = match[2]!.trim();
    if (key === "user-agent") {
      if (rulesStarted) {
        agents = [];
        rulesStarted = false;
      }
      agents.push(value);
      continue;
    }
    rulesStarted = true;
    const relevant = agents.some((a) => a === "*" || /campuswahala/i.test(a));
    if (relevant && key === "disallow") {
      const prefix = value.split(/\*|\$/)[0]!;
      if (value && path.startsWith(prefix)) return false;
    }
    if (
      relevant &&
      key === "crawl-delay" &&
      (!Number.isFinite(Number(value)) || Number(value) > 60)
    )
      return false;
    if (
      relevant &&
      !["disallow", "allow", "crawl-delay", "sitemap"].includes(key)
    )
      return false;
  }
  return true;
}

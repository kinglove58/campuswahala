import { SafeFetcher, robotsAllow } from "../apps/worker/src/safe-fetch";
import {
  landmarkResearch,
  extractLandmarks,
} from "../apps/worker/src/landmarks";
import { groundedConfidence } from "../apps/worker/src/intelligence";
import { writeFile } from "node:fs/promises";
async function main() {
  const results = [];
  for (const hint of landmarkResearch) {
    const f = new SafeFetcher();
    const url = new URL(hint.url);
    try {
      const robots = await f.fetch(`${url.origin}/robots.txt`, [url.hostname]);
      if (
        !(
          robots.status === 404 ||
          (robots.status === 200 &&
            robotsAllow(robots.body, url.pathname + url.search))
        )
      )
        throw new Error("ROBOTS_REJECTED");
      // No bypass of pacing: separate invocations handle page requests after the robots observation.
      results.push({
        campus: hint.campus,
        url: hint.url,
        observedAt: new Date().toISOString(),
        robots: "allowed",
        status: "READY_FOR_PIPELINE",
        hintKey: hint.key,
      });
    } catch (e) {
      results.push({
        campus: hint.campus,
        url: hint.url,
        observedAt: new Date().toISOString(),
        status: e instanceof Error ? e.message : "FETCH_FAILED",
        hintKey: hint.key,
      });
    }
  }
  await writeFile(
    "docs/research/phase-2-source-checks.json",
    JSON.stringify(
      {
        note: "Research discovery only. No published facts created. Pipeline must fetch, ground and publish.",
        results,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    results.map((r) => ({ campus: r.campus, url: r.url, status: r.status })),
  );
}
void extractLandmarks;
void groundedConfidence;
void main();

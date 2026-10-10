/** Bounded retries for private GETs only. Never caches or replays a mutation. */
export async function readPrivate(
  url: "/api/account/world" | "/api/academic/state" | "/api/life/state",
  signal: AbortSignal,
): Promise<Response> {
  const bounded = AbortSignal.any([signal, AbortSignal.timeout(75000)]);
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: bounded,
    });
    if (response.status !== 429 || attempt >= 14) return response;
    await new Promise<void>((resolve, reject) => {
      if (bounded.aborted) return reject(bounded.reason);
      const abort = () => {
        clearTimeout(timer);
        reject(bounded.reason);
      };
      const timer = setTimeout(() => {
        bounded.removeEventListener("abort", abort);
        resolve();
      }, 5000);
      bounded.addEventListener("abort", abort, { once: true });
    });
  }
}

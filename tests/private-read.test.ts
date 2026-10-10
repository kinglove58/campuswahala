import { afterEach, expect, it, vi } from "vitest";
import { readPrivate } from "../apps/game/app/read-private";
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});
it("retries a rate-limited private GET without caching or mutation replay", async () => {
  vi.useFakeTimers();
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(new Response(null, { status: 429 }))
    .mockResolvedValueOnce(new Response("{}", { status: 200 }));
  const pending = readPrivate("/api/life/state", new AbortController().signal);
  await vi.advanceTimersByTimeAsync(5000);
  expect((await pending).status).toBe(200);
  expect(fetcher).toHaveBeenCalledTimes(2);
  for (const [, options] of fetcher.mock.calls)
    expect(options).toMatchObject({ method: "GET", cache: "no-store" });
});
it("never retries authentication failures or unbounded rate refusals", async () => {
  vi.useFakeTimers();
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response(null, { status: 401 }));
  expect(
    (await readPrivate("/api/account/world", new AbortController().signal))
      .status,
  ).toBe(401);
  expect(fetcher).toHaveBeenCalledTimes(1);
  fetcher.mockClear().mockResolvedValue(new Response(null, { status: 429 }));
  const pending = readPrivate(
    "/api/academic/state",
    new AbortController().signal,
  );
  await vi.advanceTimersByTimeAsync(70000);
  expect((await pending).status).toBe(429);
  expect(fetcher).toHaveBeenCalledTimes(15);
});
it("aborts rate-limited reads on unmount without a background queue", async () => {
  vi.useFakeTimers();
  const fetcher = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response(null, { status: 429 }));
  const controller = new AbortController();
  const pending = readPrivate("/api/life/state", controller.signal);
  const result = expect(pending).rejects.toBeInstanceOf(DOMException);
  await vi.advanceTimersByTimeAsync(0);
  controller.abort();
  await result;
  await vi.advanceTimersByTimeAsync(70000);
  expect(fetcher).toHaveBeenCalledTimes(1);
});

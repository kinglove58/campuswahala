import { expect, it } from "vitest";
import { createApi } from "../apps/api/src/app";
import { readConfig } from "../packages/config/src";
import {
  localTrustKey,
  pseudonym,
  signContext,
} from "../packages/security/src";
import { validGuestFixture } from "../packages/testing/src";
it("enforces network creation quotas despite changing anonymous client identifiers", async () => {
  const instance = await createApi(readConfig({}));
  try {
    await instance.app.listen(0, "127.0.0.1");
    const base = await instance.app.getUrl();
    const network = pseudonym("192.0.2.1", "test-network-key");
    for (let i = 0; i <= 100; i++) {
      const context = signContext(
        { client: String(i).padStart(32, "a"), network },
        "POST",
        "/v1/guests",
        "{}\n",
        localTrustKey,
      );
      const response = await fetch(`${base}/v1/guests`, {
        method: "POST",
        headers: {
          Origin: "http://localhost:3001",
          "Content-Type": "application/json",
          "X-CW-Context": context,
        },
        body: "{}",
      });
      expect(response.status).toBe(i < 100 ? 400 : 429);
    }
  } finally {
    await instance.app.close();
    await instance.repository.close();
  }
});
it("retains session quota when a capability is used through different anonymous clients", async () => {
  const instance = await createApi(readConfig({}));
  try {
    await instance.app.listen(0, "127.0.0.1");
    const base = await instance.app.getUrl();
    const network = pseudonym("192.0.2.2", "test-network-key");
    const body = JSON.stringify(validGuestFixture);
    const creation = await fetch(`${base}/v1/guests`, {
      method: "POST",
      body,
      headers: {
        Origin: "http://localhost:3001",
        "Content-Type": "application/json",
        "X-CW-Context": signContext(
          { client: "a".repeat(32), network },
          "POST",
          "/v1/guests",
          body + "\n",
          localTrustKey,
        ),
      },
    });
    const { token } = await creation.json();
    for (let i = 0; i <= 60; i++) {
      const context = signContext(
        { client: String(i).padStart(32, "b"), network },
        "GET",
        "/v1/guests/me",
        `\n${token}`,
        localTrustKey,
      );
      expect(
        (
          await fetch(`${base}/v1/guests/me`, {
            headers: { "X-CW-Context": context, "X-Guest-Token": token },
          })
        ).status,
      ).toBe(i < 60 ? 200 : 429);
    }
  } finally {
    await instance.app.close();
    await instance.repository.close();
  }
});

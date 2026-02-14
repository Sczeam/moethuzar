import { beforeEach, describe, expect, it } from "vitest";
import { POST as loginPost } from "@/app/api/admin/auth/login/route";
import { resetRateLimiterForTests } from "@/server/security/rate-limiter";

describe("admin login rate limit", () => {
  beforeEach(() => {
    resetRateLimiterForTests();
  });

  it("returns 429 after the configured number of requests", async () => {
    const url = "http://localhost:3000/api/admin/auth/login";
    const headers = {
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.7",
    };

    for (let index = 0; index < 6; index += 1) {
      const response = await loginPost(
        new Request(url, {
          method: "POST",
          headers,
          body: JSON.stringify({}),
        })
      );

      expect(response.status).toBe(400);
    }

    const limited = await loginPost(
      new Request(url, {
        method: "POST",
        headers,
        body: JSON.stringify({}),
      })
    );
    const payload = await limited.json();

    expect(limited.status).toBe(429);
    expect(payload.code).toBe("RATE_LIMITED");
    expect(limited.headers.get("retry-after")).toBeTruthy();
    expect(limited.headers.get("x-ratelimit-limit")).toBe("6");
  });
});

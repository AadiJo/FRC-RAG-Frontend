import { describe, expect, it, vi } from "vitest";

vi.mock("@convex-dev/rate-limiter", () => {
  class RateLimiterMock {
    public __config: unknown;

    public constructor(_component: unknown, config: unknown) {
      this.__config = config;
    }
  }

  return {
    HOUR: 60 * 60 * 1000,
    RateLimiter: RateLimiterMock,
  };
});

vi.mock("../../convex/_generated/api", () => ({
  components: {
    rateLimiter: "rateLimiterComponent",
  },
}));

describe("convex/rateLimiter", () => {
  it("configures persistent daily limits only", async () => {
    const { rateLimiter } = await import("../../convex/rateLimiter");
    const { RATE_LIMITS, PERIODS } = await import(
      "../../convex/lib/rateLimitConstants"
    );

    const limiter = rateLimiter as unknown as {
      __config: Record<string, unknown>;
    };
    const configKeys = Object.keys(limiter.__config).sort();

    expect(configKeys).toEqual(["anonymousDaily", "authenticatedDaily"]);

    const cfg = limiter.__config as Record<
      string,
      { kind: string; rate: number; period: number }
    >;

    expect(cfg.anonymousDaily).toEqual({
      kind: "fixed window",
      rate: RATE_LIMITS.ANONYMOUS_DAILY,
      period: PERIODS.DAILY,
    });

    expect(cfg.authenticatedDaily).toEqual({
      kind: "fixed window",
      rate: RATE_LIMITS.AUTHENTICATED_DAILY,
      period: PERIODS.DAILY,
    });

    expect(RATE_LIMITS.AUTHENTICATED_DAILY).toBe(5);
  });
});

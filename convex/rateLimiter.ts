import { RateLimiter } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";
import { PERIODS, RATE_LIMITS } from "./lib/rateLimitConstants";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  anonymousDaily: {
    kind: "fixed window",
    rate: RATE_LIMITS.ANONYMOUS_DAILY,
    period: PERIODS.DAILY,
  },
  authenticatedDaily: {
    kind: "fixed window",
    rate: RATE_LIMITS.AUTHENTICATED_DAILY,
    period: PERIODS.DAILY,
  },
});

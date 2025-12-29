import rateLimiter from "@convex-dev/rate-limiter/convex.config";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(rateLimiter);
// TODO: R2 file storage removed - will be replaced with VPS upload
// TODO: Polar payments removed
// TODO: Resend email removed

export default app;

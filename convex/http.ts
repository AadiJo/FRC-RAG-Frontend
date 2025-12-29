import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

// TODO: Polar webhook routes removed - payments disabled

export default http;

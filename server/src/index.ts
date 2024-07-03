import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { apiRoutes } from "./api";

const app = new Hono();

app.route("/api", apiRoutes);

app.use("*", serveStatic({ root: "./public" }));
// Catch-all route to serve index.html for any unmatched routes
app.get("*", serveStatic({ path: "./public/index.html" }));

export default {
  fetch: app.fetch,
  // tls: {
  //   cert: Bun.file("cert.pem"),
  //   key: Bun.file("key.pem"),
  // },
};

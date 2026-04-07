const sendJson = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status,
  });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);
      if (url.pathname !== "/api/submit" || request.method !== "POST") {
        return sendJson({ error: "Not found" }, 404);
      }

      const origin = request.headers.get("Origin") || "";
      if (origin !== env.ORIGIN) {
        return sendJson({ error: "Forbidden" }, 403);
      }

      const contentType = request.headers.get("Content-Type") || "";
      if (!contentType.includes("application/json")) {
        return sendJson({ error: "Invalid payload" }, 400);
      }

      const body = await request.json<{ email?: string }>();
      const email =
        typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return sendJson({ error: "Invalid email" }, 400);
      }

      const { KV } = env;
      if (!KV) {
        return sendJson({ error: "Service unavailable" }, 503);
      }

      const existing = await KV.get(email);
      if (existing) {
        return sendJson({ ok: true }, 200);
      }

      await KV.put(email, new Date().toISOString());
      return sendJson({ ok: true }, 201);
    } catch (err) {
      console.error("Error processing request:", err);
      return sendJson({ error: "Internal server error" }, 500);
    }
  },
};

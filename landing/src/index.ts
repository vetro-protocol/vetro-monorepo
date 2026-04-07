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

      const origin = request.headers.get("Origin");
      if (!origin || origin !== env.ORIGIN) {
        console.log("Blocked request from origin:", origin, env.ORIGIN);
        return new Response(null, { status: 403 });
      }

      const body = await request.json<{ email?: string }>();
      const email = typeof body.email === "string" ? body.email.trim() : "";
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

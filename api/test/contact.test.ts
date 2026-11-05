import type { Context } from "hono";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  maxRequestBytes,
  validateContactForm,
  verifyTurnstile,
} from "../src/contact.ts";
import worker from "../src/index.ts";

const validForm = {
  category: "swap",
  email: "user@example.com",
  message: "Something went wrong.",
};

function toFormData(body: Record<string, unknown>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined) {
      continue;
    }
    form.append(key, value as string);
  }
  return form;
}

// Minimal Hono Context for testing. `vars` seeds the get/set store so tests can
// preload context values (e.g. the turnstileToken validateContactForm stashes).
function buildContext({ body = validForm, env = {}, vars = {} } = {}) {
  const json = vi.fn((data, status) => ({ data, status }));
  const next = vi.fn();
  const store: Record<string, unknown> = { ...vars };
  const set = vi.fn(function (key: string, value: unknown) {
    store[key] = value;
  });
  const get = vi.fn((key: string) => store[key]);
  const context = {
    env: {
      ...env,
    },
    get,
    json,
    req: {
      formData: vi.fn(async function () {
        if (typeof body === "string") {
          throw new TypeError("Invalid multipart body");
        }
        return toFormData(body);
      }),
      header: vi.fn(() => undefined),
    },
    set,
  };
  return {
    context: context as unknown as Context<{ Bindings: Env }>,
    get,
    json,
    next,
    set,
  };
}

describe("POST /contact", function () {
  // Only ORIGINS is read before the body limit or validateContactForm rejects
  // the request; a fully valid form would also need the Turnstile and email
  // bindings.
  const env = { ORIGINS: "http://localhost" } as Env;

  const postContact = (init: RequestInit) =>
    worker.request("/contact", { method: "POST", ...init }, env);

  it("returns 413 for a multipart body larger than the limit", async function () {
    const form = toFormData({
      ...validForm,
      message: "a".repeat(maxRequestBytes + 1),
    });

    const response = await postContact({ body: form });

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ error: "Request too large" });
  });

  it("returns 413 for an oversized body sent without Content-Length", async function () {
    // A streamed body carries no Content-Length, so only counting the bytes
    // actually received can reject it.
    const chunk = new TextEncoder().encode("a".repeat(maxRequestBytes + 1));
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(chunk);
        controller.close();
      },
    });

    const response = await postContact({
      body,
      // @ts-expect-error Node requires duplex for stream bodies; lib.dom lacks it
      duplex: "half",
      headers: { "Content-Type": "multipart/form-data; boundary=x" },
    });

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ error: "Request too large" });
  });

  it("passes a body within the limit on to validation", async function () {
    const form = toFormData({ ...validForm, email: "not-an-email" });

    const response = await postContact({ body: form });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid email address" });
  });
});

describe("validateContactForm", function () {
  it("returns 400 for a malformed request body", async function () {
    // @ts-expect-error Testing invalid input
    const { context, json, next } = buildContext({ body: "not json" });

    await validateContactForm(context, next);

    expect(json).toHaveBeenCalledWith({ error: "Invalid request body" }, 400);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 400 for a missing email", async function () {
    // With multipart, form.get("email") is null when the field is absent, which
    // exercises the `typeof email !== "string"` guard.
    const { context, json, next } = buildContext({
      // @ts-expect-error Testing invalid input (email field omitted)
      body: { category: "swap", message: "Something went wrong." },
    });

    await validateContactForm(context, next);

    expect(json).toHaveBeenCalledWith({ error: "Invalid email address" }, 400);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 400 for a malformed email", async function () {
    const { context, json, next } = buildContext({
      body: { ...validForm, email: "not-an-email" },
    });

    await validateContactForm(context, next);

    expect(json).toHaveBeenCalledWith({ error: "Invalid email address" }, 400);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 400 for an unknown category", async function () {
    const { context, json, next } = buildContext({
      body: { ...validForm, category: "nope" },
    });

    await validateContactForm(context, next);

    expect(json).toHaveBeenCalledWith({ error: "Invalid category" }, 400);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 400 for an empty message", async function () {
    const { context, json, next } = buildContext({
      body: { ...validForm, message: "   " },
    });

    await validateContactForm(context, next);

    expect(json).toHaveBeenCalledWith({ error: "Invalid message" }, 400);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 400 for a message longer than 5000 characters", async function () {
    const { context, json, next } = buildContext({
      body: { ...validForm, message: "a".repeat(5001) },
    });

    await validateContactForm(context, next);

    expect(json).toHaveBeenCalledWith({ error: "Invalid message" }, 400);
    expect(next).not.toHaveBeenCalled();
  });

  it("stores the form and calls next for a valid body", async function () {
    const { context, json, next, set } = buildContext();

    await validateContactForm(context, next);

    expect(set).toHaveBeenCalledWith("contactForm", validForm);
    expect(next).toHaveBeenCalledTimes(1);
    expect(json).not.toHaveBeenCalled();
  });

  it("stashes the turnstile token from the body", async function () {
    const { context, set } = buildContext({
      body: { ...validForm, token: "a-token" },
    });

    await validateContactForm(context, vi.fn());

    expect(set).toHaveBeenCalledWith("turnstileToken", "a-token");
  });
});

describe("verifyTurnstile", function () {
  afterEach(function () {
    vi.unstubAllGlobals();
  });

  const okResponse = (result: unknown) =>
    vi.fn(async () => ({ json: async () => result, ok: true }));

  it("skips verification when the secret is unset", async function () {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { context, json, next } = buildContext({
      env: { TURNSTILE_SECRET_KEY: undefined },
      vars: { turnstileToken: "a-token" },
    });

    await verifyTurnstile(context, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(json).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 400 when the token is missing", async function () {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { context, json, next } = buildContext({
      env: { TURNSTILE_SECRET_KEY: "secret" },
    });

    await verifyTurnstile(context, next);

    expect(json).toHaveBeenCalledWith({ error: "Missing captcha token" }, 400);
    expect(next).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("calls next when siteverify succeeds", async function () {
    vi.stubGlobal("fetch", okResponse({ success: true }));
    const { context, json, next } = buildContext({
      env: { TURNSTILE_SECRET_KEY: "secret" },
      vars: { turnstileToken: "a-token" },
    });

    await verifyTurnstile(context, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(json).not.toHaveBeenCalled();
  });

  it("returns 403 when siteverify reports failure", async function () {
    vi.stubGlobal("fetch", okResponse({ success: false }));
    const { context, json, next } = buildContext({
      env: { TURNSTILE_SECRET_KEY: "secret" },
      vars: { turnstileToken: "a-token" },
    });

    await verifyTurnstile(context, next);

    expect(json).toHaveBeenCalledWith(
      { error: "Captcha verification failed" },
      403,
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("fails closed with 403 when siteverify errors", async function () {
    vi.stubGlobal(
      "fetch",
      vi.fn(async function () {
        throw new Error("network down");
      }),
    );
    const { context, json, next } = buildContext({
      env: { TURNSTILE_SECRET_KEY: "secret" },
      vars: { turnstileToken: "a-token" },
    });

    await verifyTurnstile(context, next);

    expect(json).toHaveBeenCalledWith(
      { error: "Captcha verification failed" },
      403,
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("fails closed with 403 on a non-ok siteverify response", async function () {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ json: async () => ({ success: true }), ok: false })),
    );
    const { context, json, next } = buildContext({
      env: { TURNSTILE_SECRET_KEY: "secret" },
      vars: { turnstileToken: "a-token" },
    });

    await verifyTurnstile(context, next);

    expect(json).toHaveBeenCalledWith(
      { error: "Captcha verification failed" },
      403,
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when the hostname is not allowed", async function () {
    vi.stubGlobal(
      "fetch",
      okResponse({ hostname: "evil.example", success: true }),
    );
    const { context, json, next } = buildContext({
      env: {
        TURNSTILE_ALLOWED_HOSTNAMES: "vetro.org",
        TURNSTILE_SECRET_KEY: "secret",
      },
      vars: { turnstileToken: "a-token" },
    });

    await verifyTurnstile(context, next);

    expect(json).toHaveBeenCalledWith(
      { error: "Captcha verification failed" },
      403,
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when the hostname is allowed", async function () {
    vi.stubGlobal(
      "fetch",
      okResponse({ hostname: "vetro.org", success: true }),
    );
    const { context, json, next } = buildContext({
      env: {
        TURNSTILE_ALLOWED_HOSTNAMES: "app.vetro.org, vetro.org",
        TURNSTILE_SECRET_KEY: "secret",
      },
      vars: { turnstileToken: "a-token" },
    });

    await verifyTurnstile(context, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(json).not.toHaveBeenCalled();
  });

  it("does not let an empty allowlist entry allow a missing hostname", async function () {
    // A trailing comma yields an empty entry; it must not match a response with
    // no hostname.
    vi.stubGlobal("fetch", okResponse({ success: true }));
    const { context, json, next } = buildContext({
      env: {
        TURNSTILE_ALLOWED_HOSTNAMES: "vetro.org,",
        TURNSTILE_SECRET_KEY: "secret",
      },
      vars: { turnstileToken: "a-token" },
    });

    await verifyTurnstile(context, next);

    expect(json).toHaveBeenCalledWith(
      { error: "Captcha verification failed" },
      403,
    );
    expect(next).not.toHaveBeenCalled();
  });
});

import type { Context } from "hono";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  contactFeatureToggle,
  validateContactForm,
  verifyTurnstile,
} from "../src/contact.ts";

const validForm = {
  category: "swap",
  email: "user@example.com",
  message: "Something went wrong.",
};

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
      CONTACT_FORM_ENABLED: "true",
      ...env,
    },
    get,
    json,
    req: {
      header: vi.fn(() => undefined),
      json: vi.fn(async function () {
        if (typeof body === "string") {
          throw new SyntaxError("Invalid JSON");
        }
        return body;
      }),
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

describe("contactFeatureToggle", function () {
  it("returns 404 when the toggle is off", function () {
    const { context, json, next } = buildContext({
      env: { CONTACT_FORM_ENABLED: "false" },
    });

    contactFeatureToggle(context, next);

    expect(json).toHaveBeenCalledWith({ error: "Not Found" }, 404);
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when the toggle is on", function () {
    const { context, json, next } = buildContext();

    contactFeatureToggle(context, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(json).not.toHaveBeenCalled();
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

  it("returns 400 for a non-string email", async function () {
    const { context, json, next } = buildContext({
      // @ts-expect-error Testing invalid input
      body: { ...validForm, email: 42 },
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
});

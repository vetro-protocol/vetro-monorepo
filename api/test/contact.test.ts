import type { Context } from "hono";
import { describe, expect, it, vi } from "vitest";

import { contactFeatureToggle, validateContactForm } from "../src/contact.ts";

const validForm = {
  category: "swap",
  email: "user@example.com",
  message: "Something went wrong.",
};

// Minimal Hono Context for testing.
function buildContext({ body = validForm, env = {} } = {}) {
  const json = vi.fn((data, status) => ({ data, status }));
  const next = vi.fn();
  const set = vi.fn();
  const context = {
    env: {
      CONTACT_FORM_ENABLED: "true",
      ...env,
    },
    json,
    req: {
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
});

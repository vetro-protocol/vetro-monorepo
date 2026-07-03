import type { Context, Next } from "hono";

type ContactForm = {
  category: string;
  email: string;
  message: string;
};

declare module "hono" {
  interface ContextVariableMap {
    contactForm: ContactForm;
  }
}

// Topics the web app's contact form dropdown offers.
const contactCategories = ["bridge", "earn", "other", "swap"];

// Keep this in sync with the web app's isValidEmail (web/src/utils/email.ts):
// a minimal, permissive check — some text, an "@", and more text after it.
const emailPattern = /^[^\s@]+@[^\s@]+$/;
const maxMessageLength = 5000;

export function contactFeatureToggle(
  c: Context<{ Bindings: Env }>,
  next: Next,
) {
  if (c.env.CONTACT_FORM_ENABLED !== "true") {
    return c.json({ error: "Not Found" }, 404);
  }
  return next();
}

export async function validateContactForm(c: Context, next: Next) {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const { category, email, message } = (body ?? {}) as Record<string, unknown>;

  if (typeof email !== "string" || !emailPattern.test(email)) {
    return c.json({ error: "Invalid email address" }, 400);
  }
  if (typeof category !== "string" || !contactCategories.includes(category)) {
    return c.json({ error: "Invalid category" }, 400);
  }
  if (
    typeof message !== "string" ||
    message.trim().length === 0 ||
    message.length > maxMessageLength
  ) {
    return c.json({ error: "Invalid message" }, 400);
  }

  c.set("contactForm", { category, email, message });
  return next();
}

/**
 * Sends the contact form contents by email using the Cloudflare `send_email`
 * binding. The recipient must be a verified Email Routing destination; the
 * sender address comes from CONTACT_FORM_SENDER.
 */
export const sendContactEmail = ({
  category,
  email,
  env,
  message,
}: ContactForm & { env: Env }) =>
  env.SEND_EMAIL.send({
    from: env.CONTACT_FORM_SENDER!,
    replyTo: email,
    subject: `New support request: ${category}`,
    text: `New contact form submission.

From: ${email}
Category: ${category}
Received: ${new Date().toUTCString()}

Message:
${message}

--
Reply directly to this email to respond to the sender`,
    to: env.CONTACT_FORM_RECIPIENT!,
  });

/**
 * Sends the submitter an acknowledgement that their contact form request was
 * received. Replies route back to CONTACT_FORM_RECIPIENT so the support team
 * picks up any response.
 */
export const sendContactConfirmation = ({
  category,
  email,
  env,
}: Omit<ContactForm, "message"> & { env: Env }) =>
  env.SEND_EMAIL.send({
    from: env.CONTACT_FORM_SENDER!,
    replyTo: env.CONTACT_FORM_RECIPIENT!,
    subject: "We received your message",
    text: `Hi,

Thanks for contacting us. We have received your enquiry
(category: ${category}) and will respond as soon as we can.

This was sent to ${email}. If you did not submit this,
you can ignore this email.

--
Vetro Service & Support Ltd.
You received this because you used the contact form at ${env.WEBSITE_URL}.
Privacy policy: https://vetro.org/privacy-policy
Contact: ${env.CONTACT_FORM_RECIPIENT!}`,
    to: email,
  });

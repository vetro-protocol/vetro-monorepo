import type { Context, Next } from "hono";

// Already base64-encoded and shaped for the SEND_EMAIL binding's attachments.
type Attachment = {
  content: string;
  disposition: "attachment";
  filename: string;
  type: string;
};

type ContactForm = {
  category: string;
  email: string;
  files: File[];
  message: string;
};

declare module "hono" {
  interface ContextVariableMap {
    contactForm: ContactForm;
    // Unknown because it comes straight off the multipart
    // form field; verifyTurnstile validates its type.
    turnstileToken: unknown;
  }
}

// Topics the web app's contact form dropdown offers.
const contactCategories = ["bridge", "earn", "other", "swap"];

// Keep this in sync with the web app's isValidEmail (web/src/utils/email.ts):
// a minimal, permissive check — some text, an "@", and more text after it.
const emailPattern = /^[^\s@]+@[^\s@]+$/;
const maxMessageLength = 5000;

const isValidMessage = (message: unknown): message is string =>
  typeof message === "string" &&
  message.trim().length > 0 &&
  message.length <= maxMessageLength;

// Attachment limits. See https://developers.cloudflare.com/email-service/platform/limits/
const allowedAttachmentTypes = ["image/jpeg", "image/png"];
const maxAttachmentCount = 5;
const maxTotalAttachmentBytes = 3_500_000;

// Upper bound on the whole request body, checked before formData() buffers it.
// Headroom over the attachment budget covers the multipart boundaries and the
// text fields (message is capped at 5000 chars).
const maxRequestBytes = maxTotalAttachmentBytes + 500_000;

// Same checks (and order) as the web app's getAttachmentError so a submission
// rejected client-side reports the matching reason here. See
// web/src/hooks/useAttachments.ts.
function validateAttachments(files: File[]) {
  if (files.some((file) => !allowedAttachmentTypes.includes(file.type))) {
    return "Unsupported attachment type";
  }
  if (files.length > maxAttachmentCount) {
    return "Too many attachments";
  }
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > maxTotalAttachmentBytes) {
    return "Attachments too large";
  }
  return undefined;
}

// Base64-encodes each file for the SEND_EMAIL binding. Deferred until after the
// captcha passes so an unverified request can't force multi-MB reads + encoding.
export const encodeAttachments = (files: File[]): Promise<Attachment[]> =>
  Promise.all(
    files.map(async (file) => ({
      // Standard base64 (not base64url) — MIME attachments require it.
      content: Buffer.from(await file.arrayBuffer()).toString("base64"),
      disposition: "attachment" as const,
      filename: file.name,
      type: file.type,
    })),
  );

export function contactFeatureToggle(
  c: Context<{ Bindings: Env }>,
  next: Next,
) {
  if (c.env.CONTACT_FORM_ENABLED !== "true") {
    return c.json({ error: "Not Found" }, 404);
  }
  return next();
}

const siteverifyUrl =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type SiteverifyResponse = {
  hostname?: string;
  success?: boolean;
};

// Defense-in-depth: when TURNSTILE_ALLOWED_HOSTNAMES is set (comma-separated),
// require siteverify's reported hostname to be one of them, so a token minted on
// another site can't be replayed here. Left unset (local/staging), the check is
// skipped. Cross-origin browser abuse is already blocked by CORS; this closes
// the gap for non-browser clients replaying a token.
function isAllowedHostname(hostname: string | undefined, env: Env) {
  const allowed = env.TURNSTILE_ALLOWED_HOSTNAMES;
  if (!allowed) {
    return true;
  }
  return allowed
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .includes(hostname ?? "");
}

/**
 * Verifies the Cloudflare Turnstile token supplied with the contact form
 * submission against Cloudflare's siteverify endpoint. Verification is skipped
 * entirely when TURNSTILE_SECRET_KEY is unset, so environments without
 * Turnstile configured (e.g. local dev) keep working.
 */
export async function verifyTurnstile(
  c: Context<{ Bindings: Env }>,
  next: Next,
) {
  const secret = c.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return next();
  }

  // Token was pulled off the already-parsed body by validateContactForm.
  const token = c.get("turnstileToken");
  if (typeof token !== "string" || token.length === 0) {
    return c.json({ error: "Missing captcha token" }, 400);
  }

  // Turnstile's siteverify expects application/x-www-form-urlencoded
  const body = new URLSearchParams({ response: token, secret });
  const remoteIp = c.req.header("CF-Connecting-IP");
  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }

  try {
    const response = await fetch(siteverifyUrl, { body, method: "POST" });
    if (response.ok) {
      const result = (await response.json()) as SiteverifyResponse;
      if (
        result.success === true &&
        isAllowedHostname(result.hostname, c.env)
      ) {
        return next();
      }
    }
  } catch {
    // Fall through to the fail-closed rejection below.
  }

  return c.json({ error: "Captcha verification failed" }, 403);
}

export async function validateContactForm(c: Context, next: Next) {
  // Reject oversized bodies before formData() reads them into memory. The
  // captcha token lives inside the body, so it can't gate this earlier; this
  // bounds the pre-verification read for any client that reports its size.
  if (Number(c.req.header("Content-Length")) > maxRequestBytes) {
    return c.json({ error: "Request too large" }, 413);
  }

  let form: FormData;
  try {
    form = await c.req.formData();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const category = form.get("category");
  const email = form.get("email");
  const message = form.get("message");
  const token = form.get("token");
  const files = form
    .getAll("files")
    .filter((value): value is File => value instanceof File);

  if (typeof email !== "string" || !emailPattern.test(email)) {
    return c.json({ error: "Invalid email address" }, 400);
  }
  if (typeof category !== "string" || !contactCategories.includes(category)) {
    return c.json({ error: "Invalid category" }, 400);
  }
  if (!isValidMessage(message)) {
    return c.json({ error: "Invalid message" }, 400);
  }

  const attachmentError = validateAttachments(files);
  if (attachmentError) {
    return c.json({ error: attachmentError }, 400);
  }

  c.set("contactForm", { category, email, files, message });
  // Hand the raw token to verifyTurnstile so it doesn't re-parse the body.
  c.set("turnstileToken", token);
  return next();
}

/**
 * Sends the contact form contents by email using the Cloudflare `send_email`
 * binding. The recipient must be a verified Email Routing destination; the
 * sender address comes from CONTACT_FORM_SENDER.
 */
export const sendContactEmail = ({
  attachments,
  category,
  email,
  env,
  message,
}: Omit<ContactForm, "files"> & { attachments: Attachment[]; env: Env }) =>
  env.SEND_EMAIL.send({
    attachments,
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
}: Omit<ContactForm, "files" | "message"> & { env: Env }) =>
  env.SEND_EMAIL.send({
    from: { email: env.CONTACT_FORM_SENDER!, name: "Vetro Support" },
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

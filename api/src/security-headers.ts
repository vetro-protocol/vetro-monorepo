import type { MiddlewareHandler } from "hono";

const contentSecurityPolicy = [
  "base-uri 'none'",
  "default-src 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  "require-trusted-types-for 'script'",
  "sandbox",
  "upgrade-insecure-requests",
].join("; ");

const permissionsPolicy = [
  "accelerometer=()",
  "autoplay=()",
  "bluetooth=()",
  "camera=()",
  "captured-surface-control=()",
  "compute-pressure=()",
  "cross-origin-isolated=()",
  "deferred-fetch=()",
  "deferred-fetch-minimal=()",
  "display-capture=()",
  "encrypted-media=()",
  "fullscreen=()",
  "gamepad=()",
  "geolocation=()",
  "gyroscope=()",
  "hid=()",
  "identity-credentials-get=()",
  "idle-detection=()",
  "local-fonts=()",
  "magnetometer=()",
  "microphone=()",
  "midi=()",
  "payment=()",
  "picture-in-picture=()",
  "publickey-credentials-create=()",
  "publickey-credentials-get=()",
  "screen-wake-lock=()",
  "serial=()",
  "storage-access=()",
  "usb=()",
  "web-share=()",
  "window-management=()",
  "xr-spatial-tracking=()",
].join(", ");

export const securityHeaders: MiddlewareHandler = async function (c, next) {
  await next();

  c.header("Content-Security-Policy", contentSecurityPolicy);
  c.header("Cross-Origin-Embedder-Policy", "require-corp");
  c.header("Cross-Origin-Opener-Policy", "same-origin");
  c.header("Cross-Origin-Resource-Policy", "same-origin");
  c.header("Origin-Agent-Cluster", "?1");
  c.header("Permissions-Policy", permissionsPolicy);
  c.header("Referrer-Policy", "no-referrer");
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");

  if (!c.res.headers.has("Cache-Control")) {
    c.header("Cache-Control", "no-store");
  }
};

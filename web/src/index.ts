// Worker entry point – proxies static assets and injects security headers.

/// <reference types="@cloudflare/workers-types" />

import { allChains } from "networks";
import { getUrlOrigin } from "utils/url";

type Env = {
  ASSETS: Fetcher;
};

// Extract unique RPC URLs
const rpcUrls = allChains.flatMap((chain) => chain.rpcUrls.default.http);

const allUrls: (string | undefined)[] = [
  import.meta.env.VITE_PORTAL_API_URL,
  import.meta.env.VITE_VETRO_API_URL,
  ...rpcUrls,
  import.meta.env.VITE_SENTRY_DSN,
];

// Build connect-src dynamically from env vars baked in at build time.
const connectSrc = [
  "'self'",
  ...allUrls.map(getUrlOrigin).filter(Boolean),
].join(" ");

const workerSrc = import.meta.env.VITE_SENTRY_DSN ? "blob:" : "'none'";

// Deny all permissions – mirrors api/src/security-headers.ts.
const permissionsPolicy = [
  "accelerometer",
  "ambient-light-sensor",
  "attribution-reporting",
  "autoplay",
  "battery",
  "bluetooth",
  "camera",
  "ch-ua",
  "ch-ua-arch",
  "ch-ua-bitness",
  "ch-ua-full-version",
  "ch-ua-full-version-list",
  "ch-ua-mobile",
  "ch-ua-model",
  "ch-ua-platform",
  "ch-ua-platform-version",
  "ch-ua-wow64",
  "compute-pressure",
  "cross-origin-isolated",
  "direct-sockets",
  "display-capture",
  "encrypted-media",
  "execution-while-not-rendered",
  "execution-while-out-of-viewport",
  "fullscreen",
  "geolocation",
  "gyroscope",
  "hid",
  "identity-credentials-get",
  "idle-detection",
  "keyboard-map",
  "magnetometer",
  "microphone",
  "midi",
  "navigation-override",
  "payment",
  "picture-in-picture",
  "publickey-credentials-get",
  "screen-wake-lock",
  "serial",
  "storage-access",
  "sync-xhr",
  "usb",
  "web-share",
  "window-management",
  "xr-spatial-tracking",
]
  .map((feature) => `${feature}=()`)
  .join(", ");

const csp = [
  "base-uri 'none'",
  `connect-src ${connectSrc}`,
  "default-src 'none'",
  "font-src 'self' https://fonts.gstatic.com",
  "form-action 'none'",
  "frame-ancestors 'none'",
  "img-src 'self' data: https://hemilabs.github.io",
  "script-src 'self'",
  // Tailwind v4 injects styles via a <style> tag, so 'unsafe-inline' is needed.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "upgrade-insecure-requests",
  `worker-src ${workerSrc}`,
].join("; ");

// Applied to all responses – these have meaningful effect on sub-resources.
const commonHeaders = {
  "Content-Security-Policy": "default-src 'none'",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
};

// Applied only to HTML documents – these are navigation-level controls.
// CSP is stricter for HTML responses so it overrides the commonHeaders CSP.
const htmlHeaders = {
  "Content-Security-Policy": csp,
  "Cross-Origin-Opener-Policy": "same-origin",
  "Origin-Agent-Cluster": "?1",
  "Permissions-Policy": permissionsPolicy,
  "X-DNS-Prefetch-Control": "off",
  "X-Frame-Options": "DENY",
};

export default {
  async fetch(request: Request, env: Env) {
    const response = await env.ASSETS.fetch(request);
    const newResponse = new Response(response.body, response);

    for (const [key, value] of Object.entries(commonHeaders)) {
      newResponse.headers.set(key, value);
    }

    const contentType = response.headers.get("Content-Type") ?? "";
    if (contentType.includes("text/html")) {
      for (const [key, value] of Object.entries(htmlHeaders)) {
        newResponse.headers.set(key, value);
      }
    }

    return newResponse;
  },
} satisfies ExportedHandler<Env>;

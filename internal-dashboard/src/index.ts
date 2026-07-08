// Worker entry point – proxies static assets and injects security headers.

/// <reference types="@cloudflare/workers-types" />

type Env = {
  ASSETS: Fetcher;
};

// Deny all permissions – mirrors web/src/index.ts.
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

// Token USD prices come from the Portal API and on-chain reads use the mainnet
// RPC; both origins are env-driven (see .env / .env.local) so overrides are also
// allowed by the CSP. The RPC env may hold several URLs joined by "+".
const portalApiUrl = import.meta.env.VITE_PORTAL_API_URL;
const rpcConnectSrc = (import.meta.env.VITE_RPC_URL_MAINNET ?? "")
  .split("+")
  .join(" ");

// In dev mode, Vite injects an inline React Fast Refresh preamble script, so
// 'unsafe-inline' is required.
const scriptSrc = [
  "'self'",
  ...(import.meta.env.DEV ? ["'unsafe-inline'"] : []),
].join(" ");

const csp = [
  "base-uri 'none'",
  // The DEX tab reads Curve liquidity straight from the Curve API (pool list /
  // volumes / gauges) and per-pool 24h fees from Curve's analytics API. Sushi
  // pools come entirely from Sushi's own data API. Tracked-token discovery and
  // share values are read on-chain from the mainnet RPC, and token USD prices
  // come from the Portal API.
  `connect-src 'self' https://api.curve.finance https://prices.curve.finance https://production.data-gcp.sushi.com ${rpcConnectSrc} ${portalApiUrl}`,
  "default-src 'none'",
  "font-src 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  // Token logos come from the Hemilabs token list (GitHub Pages), falling back
  // to the Curve/Sushi asset CDNs (jsDelivr).
  "img-src 'self' data: https://hemilabs.github.io https://cdn.jsdelivr.net",
  `script-src ${scriptSrc}`,
  // Tailwind v4 injects styles via a <style> tag, so 'unsafe-inline' is needed.
  "style-src 'self' 'unsafe-inline'",
  "upgrade-insecure-requests",
  "worker-src 'none'",
].join("; ");

// Applied to all responses – these have meaningful effect on sub-resources.
const commonHeaders = {
  "Content-Security-Policy": "default-src 'none'",
  "Cross-Origin-Embedder-Policy": "credentialless",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Referrer-Policy": "no-referrer",
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

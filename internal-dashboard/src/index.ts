// Worker entry point – proxies static assets and injects security headers.

/// <reference types="@cloudflare/workers-types" />

import { getAddress } from "viem";

import type { StakeDaoCampaign } from "./lib/stakeDaoApi";

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

// The DEX pools come from the VETRO API, token USD prices from the Portal API,
// and on-chain reads use the mainnet RPC; these origins are env-driven (see
// .env / .env.local) so overrides are also allowed by the CSP. The RPC env may
// hold several URLs joined by "+".
const portalApiUrl = import.meta.env.VITE_PORTAL_API_URL;
const vetroApiUrl = import.meta.env.VITE_VETRO_API_URL;
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
  `connect-src 'self' https://api.curve.finance https://prices.curve.finance ${rpcConnectSrc} ${portalApiUrl} ${vetroApiUrl}`,
  "default-src 'none'",
  "font-src 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  // Token logos come from the Hemilabs token list (GitHub Pages), falling back
  // to the venues' asset CDNs — Curve, Sushi and Uniswap (all jsDelivr).
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

const merklOpportunitiesPath = "/api/merkl/opportunities";
const merklOpportunitiesUpstream = "https://api.merkl.xyz/v4/opportunities";

// StakeDAO answers with every campaign ever created (several MB) and offers
// no server-side filter, so the worker trims the list to the requested gauges.
// The upstream response is cached because of this.
const stakeDaoCampaignsPath = "/api/stakedao/campaigns";
const stakeDaoCampaignsUpstream =
  "https://api-v3.stakedao.org/votemarket/curve";
const stakeDaoCacheSeconds = 3 * 60;

const jsonResponse = ({
  body,
  status = 200,
}: {
  body: BodyInit | null;
  status?: number;
}) =>
  new Response(body, {
    headers: { "content-type": "application/json" },
    status,
  });

const fetchStakeDao = (upstream: string) =>
  fetch(upstream, {
    cf: {
      cacheEverything: true,
      cacheTtlByStatus: { "200-299": stakeDaoCacheSeconds, "400-599": 0 },
    },
  });

const servedCampaign = (campaign: StakeDaoCampaign): StakeDaoCampaign => ({
  currentPeriod: {
    rewardPerPeriod: campaign.currentPeriod.rewardPerPeriod,
    rewardPerVote: campaign.currentPeriod.rewardPerVote,
  },
  endTimestamp: campaign.endTimestamp,
  gauge: getAddress(campaign.gauge),
  gaugeChainId: campaign.gaugeChainId,
  id: campaign.id,
  isCanceled: campaign.isCanceled,
  isClosed: campaign.isClosed,
  key: campaign.key,
  rewardToken: {
    price: campaign.rewardToken.price,
    symbol: campaign.rewardToken.symbol,
  },
  totalRewardAmount: campaign.totalRewardAmount,
});

const proxyStakeDaoCampaigns = async function (searchParams: URLSearchParams) {
  const gauges = (searchParams.get("gauges") ?? "").toLowerCase().split(",");
  const response = await fetchStakeDao(stakeDaoCampaignsUpstream);
  if (!response.ok) {
    return jsonResponse({ body: response.body, status: response.status });
  }
  const { campaigns } = (await response.json()) as {
    campaigns: StakeDaoCampaign[];
  };
  return jsonResponse({
    body: JSON.stringify(
      campaigns
        .filter((campaign) => gauges.includes(campaign.gauge.toLowerCase()))
        .map(servedCampaign),
    ),
  });
};

type MerklOpportunitiesQuery = {
  campaigns: boolean;
  chainIds: number[];
  identifiers: string[];
  items: number;
  status: string;
};

const proxyMerklOpportunities = async function (request: Request) {
  const { campaigns, chainIds, identifiers, items, status } =
    (await request.json()) as MerklOpportunitiesQuery;
  const search = new URLSearchParams({
    campaigns: String(campaigns),
    chainId: chainIds.join(","),
    identifier: identifiers.join(","),
    items: String(items),
    status,
  });
  const response = await fetch(`${merklOpportunitiesUpstream}?${search}`);
  return jsonResponse({ body: response.body, status: response.status });
};

const apiHandlers: Record<
  string,
  (params: { request: Request; url: URL }) => Promise<Response>
> = {
  [`GET ${stakeDaoCampaignsPath}`]: ({ url }) =>
    proxyStakeDaoCampaigns(url.searchParams),
  [`QUERY ${merklOpportunitiesPath}`]: ({ request }) =>
    proxyMerklOpportunities(request),
};

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    const apiHandler = apiHandlers[`${request.method} ${url.pathname}`];
    if (apiHandler) {
      return apiHandler({ request, url });
    }

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

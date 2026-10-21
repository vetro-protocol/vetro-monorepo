import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import worker from "./index";

const assetsFetch = vi.fn();
const upstreamFetch = vi.fn();

const env = { ASSETS: { fetch: assetsFetch } };

const send = (request: Request) =>
  // @ts-expect-error the stub implements only the Fetcher method the worker calls
  worker.fetch(request, env);

const removedRoutes = [
  { method: "POST", path: "/api/brownfi" },
  { method: "POST", path: "/api/sushi" },
  { method: "POST", path: "/api/sushi-subgraph" },
  { method: "POST", path: "/api/uniswap" },
  { method: "GET", path: "/api/stakedao/strategies?chainId=1&gauges=0x1" },
];

beforeEach(function () {
  assetsFetch.mockImplementation(
    async () =>
      new Response("asset body", {
        headers: { "Content-Type": "text/plain" },
        status: 404,
      }),
  );
  upstreamFetch.mockImplementation(async () => new Response("[]"));
  vi.stubGlobal("fetch", upstreamFetch);
});

afterEach(function () {
  vi.unstubAllGlobals();
});

describe("removed pool proxies", function () {
  it.each(removedRoutes)(
    "$method $path falls through to the static assets",
    async function ({ method, path }) {
      const request = new Request(`http://localhost${path}`, {
        body: method === "POST" ? JSON.stringify({ query: "{}" }) : undefined,
        method,
      });

      const response = await send(request);

      expect(assetsFetch).toHaveBeenCalledTimes(1);
      expect(assetsFetch.mock.calls[0][0]).toBe(request);
      expect(upstreamFetch).not.toHaveBeenCalled();
      expect(response.status).toBe(404);
      expect(await response.text()).toBe("asset body");
      // The asset path adds the common headers; an API handler would not.
      expect(response.headers.get("Content-Security-Policy")).toBe(
        "default-src 'none'",
      );
      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    },
  );
});

describe("kept API routes", function () {
  it("GET /api/stakedao/campaigns is still proxied upstream", async function () {
    upstreamFetch.mockImplementation(
      async () => new Response(JSON.stringify({ campaigns: [] })),
    );

    const response = await send(
      new Request("http://localhost/api/stakedao/campaigns?gauges=0x1"),
    );

    expect(assetsFetch).not.toHaveBeenCalled();
    expect(upstreamFetch).toHaveBeenCalledTimes(1);
    expect(upstreamFetch.mock.calls[0][0]).toBe(
      "https://api-v3.stakedao.org/votemarket/curve",
    );
    expect(await response.json()).toStrictEqual([]);
  });

  it("QUERY /api/merkl/opportunities is still proxied upstream", async function () {
    const response = await send(
      new Request("http://localhost/api/merkl/opportunities", {
        body: JSON.stringify({
          campaigns: true,
          chainIds: [1, 43111],
          identifiers: ["0xabc"],
          items: 100,
          status: "LIVE",
        }),
        method: "QUERY",
      }),
    );

    expect(assetsFetch).not.toHaveBeenCalled();
    expect(upstreamFetch).toHaveBeenCalledTimes(1);
    expect(upstreamFetch.mock.calls[0][0]).toBe(
      "https://api.merkl.xyz/v4/opportunities?campaigns=true&chainId=1%2C43111&identifier=0xabc&items=100&status=LIVE",
    );
    expect(response.status).toBe(200);
  });
});

describe("HTML Content-Security-Policy", function () {
  it("allows the VETRO API origin in connect-src", async function () {
    assetsFetch.mockImplementation(
      async () =>
        new Response("<html></html>", {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }),
    );
    const vetroApiUrl = import.meta.env.VITE_VETRO_API_URL;

    const response = await send(new Request("http://localhost/dex"));

    expect(vetroApiUrl).toBeTruthy();
    const connectSrc = (response.headers.get("Content-Security-Policy") ?? "")
      .split("; ")
      .find((directive) => directive.startsWith("connect-src "));
    expect(connectSrc?.split(" ")).toContain(vetroApiUrl);
  });
});

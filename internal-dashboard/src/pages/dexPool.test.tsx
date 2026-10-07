import { renderToStaticMarkup } from "react-dom/server";
import { type Address } from "viem";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useShareTokenRates } from "../hooks/useShareTokenRates";
import { useTrackedPools } from "../hooks/useTrackedPools";
import { useTrackedTokens } from "../hooks/useTrackedTokens";
import { type TrackedPool, type TrackedToken } from "../lib/types";

import { DexPoolPage } from "./dexPool";

vi.mock("react-router", () => ({
  Link: ({ children }: { children: unknown }) => children,
  useParams: () => ({ poolId: "pool-1" }),
}));

vi.mock("../hooks/useShareTokenRates", () => ({
  useShareTokenRates: vi.fn(),
}));
vi.mock("../hooks/useTrackedPools", () => ({ useTrackedPools: vi.fn() }));
vi.mock("../hooks/useTrackedTokens", () => ({ useTrackedTokens: vi.fn() }));

// The page's other sections run their own queries; they don't affect the card.
vi.mock("../components/dex/campaignsList", () => ({
  CampaignsList: () => null,
}));
vi.mock("../components/dex/chainLogo", () => ({ ChainLogo: () => null }));
vi.mock("../components/dex/explorerLink", () => ({ ExplorerLink: () => null }));
vi.mock("../components/dex/tokenIcon", () => ({ TokenIcon: () => null }));
vi.mock("../components/dex/tokenPair", () => ({ TokenPair: () => null }));
vi.mock("../components/dex/venueBadge", () => ({ VenueBadge: () => null }));

type QueryState<T> = {
  data: T | undefined;
  isError: boolean;
  isPending: boolean;
};

const pending = <T,>(): QueryState<T> => ({
  data: undefined,
  isError: false,
  isPending: true,
});

const settled = <T,>(data: T): QueryState<T> => ({
  data,
  isError: false,
  isPending: false,
});

const failed = <T,>(): QueryState<T> => ({
  data: undefined,
  isError: true,
  isPending: false,
});

const peggedToken: Address = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
const stablecoin: Address = "0x1111111111111111111111111111111111111111";
const shareToken: Address = "0xfedcbafedcbafedcbafedcbafedcbafedcbafedc";

const trackedTokens: TrackedToken[] = [
  {
    address: peggedToken,
    decimals: 18,
    extensions: { priceSymbol: "USD" },
    symbol: "PEG",
  },
  {
    address: shareToken,
    assetDecimals: 18,
    decimals: 18,
    extensions: { isVaultShare: true, priceSymbol: "USD" },
    symbol: "sPEG",
  },
];

const sharePrice = 1.0249;

const pool = (coins: TrackedPool["coins"]): TrackedPool => ({
  address: `0x${"2".repeat(40)}`,
  baseApy: undefined,
  chainId: 1,
  coins,
  dex: "sushi",
  emissionApr: 0,
  emissionAprMax: 0,
  feesUsd24h: 0,
  gaugeAddress: undefined,
  id: "pool-1",
  lpTokenAddress: undefined,
  name: "pool-1",
  poolType: "v3",
  tvlUsd: undefined,
  url: "",
  virtualPrice: 1,
  volumeUsd24h: 0,
});

// Rate 1.002 → +0.2% off a 1:1 peg.
const plainPool = pool([
  {
    address: peggedToken,
    balance: 0n,
    decimals: 18,
    symbol: "PEG",
    usdPrice: 1.002,
  },
  {
    address: stablecoin,
    balance: 0n,
    decimals: 6,
    symbol: "USDC",
    usdPrice: 1,
  },
]);

// Rate 1.02424 against an expected rate of 1.0249.
const sharePool = pool([
  {
    address: shareToken,
    balance: 0n,
    decimals: 18,
    symbol: "sPEG",
    usdPrice: 1.02424,
  },
  {
    address: peggedToken,
    balance: 0n,
    decimals: 18,
    symbol: "PEG",
    usdPrice: 1,
  },
]);

// Computed independently: (1.002 - 1) * 100, and 1 / 1.002 at 6 significant digits.
const plainDriftHint = "+0.200% vs. peg";
const plainInverseHint = "1 USDC = 0.998004 PEG";
// (1.02424 / 1.0249 - 1) * 100 ≈ -0.0644, and 1 / 1.02424 at 6 significant digits.
const shareDriftHint = "-0.064% vs. expected rate (1.0249)";
const shareInverseHint = "1 PEG = 0.976334 sPEG";

const mockQueries = function ({
  shareRates,
  tokens,
  trackedPool,
}: {
  shareRates: QueryState<Record<string, number>>;
  tokens: QueryState<TrackedToken[]>;
  trackedPool: TrackedPool;
}) {
  // @ts-expect-error only the fields the page reads are mocked
  vi.mocked(useTrackedPools).mockReturnValue(settled([trackedPool]));
  // @ts-expect-error only the fields the card reads are mocked
  vi.mocked(useTrackedTokens).mockReturnValue(tokens);
  // @ts-expect-error only the fields the card reads are mocked
  vi.mocked(useShareTokenRates).mockReturnValue(shareRates);
};

// Returns the card's value and hint (undefined when no hint is rendered).
const exchangeRateCard = function () {
  const markup = renderToStaticMarkup(<DexPoolPage />).replaceAll(
    "<!-- -->",
    "",
  );
  const match = markup.match(
    /Exchange rate<\/p><p[^>]*>(.*?)<\/p>(?:<div[^>]*>(.*?)<\/div>)?<\/div>/,
  );
  if (!match) {
    throw new Error("Exchange rate card not rendered");
  }
  return { hint: match[2]?.replace(/<[^>]+>/g, ""), value: match[1] };
};

const lastShareRatesEnabled = () =>
  vi.mocked(useShareTokenRates).mock.lastCall?.[0].enabled;

describe("DexPoolPage exchange rate card", function () {
  beforeEach(function () {
    vi.resetAllMocks();
  });

  describe("plain peg pool", function () {
    it("shows no hint while the tracked tokens load", function () {
      mockQueries({
        shareRates: pending(),
        tokens: pending(),
        trackedPool: plainPool,
      });

      const card = exchangeRateCard();

      expect(card.value).toBe("1 PEG = 1.002 USDC");
      expect(card.hint).toBeUndefined();
    });

    it("shows the drift once the tracked tokens load, though the share rates query is disabled", function () {
      // A disabled query stays pending forever.
      mockQueries({
        shareRates: pending(),
        tokens: settled(trackedTokens),
        trackedPool: plainPool,
      });

      const card = exchangeRateCard();

      expect(lastShareRatesEnabled()).toBe(false);
      expect(card.hint).toBe(plainDriftHint);
    });

    it("shows the inverse rate when the tracked tokens fail to load", function () {
      mockQueries({
        shareRates: pending(),
        tokens: failed(),
        trackedPool: plainPool,
      });

      expect(exchangeRateCard().hint).toBe(plainInverseHint);
    });
  });

  describe("pool with a share leg", function () {
    it("shows no hint while the tracked tokens load", function () {
      mockQueries({
        shareRates: pending(),
        tokens: pending(),
        trackedPool: sharePool,
      });

      expect(exchangeRateCard().hint).toBeUndefined();
    });

    it("shows no hint while the share rates load", function () {
      mockQueries({
        shareRates: pending(),
        tokens: settled(trackedTokens),
        trackedPool: sharePool,
      });

      const card = exchangeRateCard();

      expect(lastShareRatesEnabled()).toBe(true);
      expect(card.value).toBe("1 sPEG = 1.02424 PEG");
      expect(card.hint).toBeUndefined();
    });

    it("shows the drift from the vault rate once the share rates load", function () {
      mockQueries({
        shareRates: settled({ [shareToken.toLowerCase()]: sharePrice }),
        tokens: settled(trackedTokens),
        trackedPool: sharePool,
      });

      expect(exchangeRateCard().hint).toBe(shareDriftHint);
    });

    it("labels the drift against the expected rate when the vault rate is exactly 1", function () {
      mockQueries({
        shareRates: settled({ [shareToken.toLowerCase()]: 1 }),
        tokens: settled(trackedTokens),
        trackedPool: sharePool,
      });

      // (1.02424 / 1 - 1) * 100 = 2.424; the share leg keeps the expected-rate label.
      expect(exchangeRateCard().hint).toBe("+2.424% vs. expected rate (1)");
    });

    it("shows the inverse rate once loaded when the vault has no rate", function () {
      mockQueries({
        shareRates: settled({}),
        tokens: settled(trackedTokens),
        trackedPool: sharePool,
      });

      expect(exchangeRateCard().hint).toBe(shareInverseHint);
    });

    it("shows the inverse rate when the share rates fail to load", function () {
      mockQueries({
        shareRates: failed(),
        tokens: settled(trackedTokens),
        trackedPool: sharePool,
      });

      expect(exchangeRateCard().hint).toBe(shareInverseHint);
    });
  });
});

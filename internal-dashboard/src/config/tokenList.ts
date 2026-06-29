// Token logos from the Hemilabs token list (same source web uses), keyed by
// symbol. The logo file name is the lowercased symbol, save for a few overrides.
const HEMI_LOGO_BASE = "https://hemilabs.github.io/token-list/l1Logos";

// Symbols whose logo file name differs from the lowercased symbol.
const logoSlugOverrides: Record<string, string> = {
  vusd: "vetrousd",
};

export const tokenListLogoUrl = function (symbol: string) {
  const key = symbol.toLowerCase();
  return `${HEMI_LOGO_BASE}/${logoSlugOverrides[key] ?? key}.svg`;
};

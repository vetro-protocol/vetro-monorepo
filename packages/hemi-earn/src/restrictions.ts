import {
  restrictedCountries as coreRestrictedCountries,
  sanctionedCountries as coreSanctionedCountries,
} from "@vetro-protocol/core";

// Declared locally so the published types say string[] instead of pointing at
// @vetro-protocol/core, which is private and not on npm.
export const restrictedCountries: string[] = coreRestrictedCountries;
export const sanctionedCountries: string[] = coreSanctionedCountries;

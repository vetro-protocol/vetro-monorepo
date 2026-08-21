export const featureFlags = {
  fixedTermYield: import.meta.env.VITE_FIXED_TERM_YIELD_ENABLED === "true",
  variableYieldDetails:
    import.meta.env.VITE_VARIABLE_YIELD_DETAILS_ENABLED === "true",
};

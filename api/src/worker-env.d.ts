// Worker environment bindings.
// When you add or rename a binding in `wrangler.jsonc`,
// update this interface to match.
interface Env {
  CACHE_KV: KVNamespace;
  CUSTOM_RPC_URL_MAINNET?: string;
  MERKL_OPPORTUNITY_SVETBTC?: string;
  MERKL_OPPORTUNITY_SVUSD?: string;
  ORIGINS: string;
  CF_VERSION_METADATA?: WorkerVersionMetadata;
  SENTRY_DSN?: string;
  SUBGRAPH_API_KEY?: string;
  SUBGRAPH_ID?: string;
  SUBGRAPH_URL_TEMPLATE: string;
}

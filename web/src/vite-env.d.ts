/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONTACT_FORM_ENABLED?: string;
  readonly VITE_DEPLOY_ENV?: string;
  readonly VITE_PORTAL_API_URL?: string;
  readonly VITE_RPC_URL_MAINNET?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_STAGING_API_PREVIEW_HOST?: string;
  readonly VITE_STAGING_WEB_PREVIEW_HOST?: string;
  readonly VITE_VETRO_API_URL?: string;
  readonly VITE_WALLET_CONNECT_PROJECT_ID: string;
}

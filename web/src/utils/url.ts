export const isRelativeUrl = (url: string) => url.startsWith("/");

// Maps a web staging preview host to its matching API preview. The preview host
// suffixes come from the preview build env. Gated to the preview build so it's
// dead-code eliminated everywhere else.
export function deriveApiOrigin(hostname: string) {
  if (import.meta.env.VITE_DEPLOY_ENV !== "preview") {
    return undefined;
  }
  const webHost = import.meta.env.VITE_STAGING_WEB_PREVIEW_HOST;
  const apiHost = import.meta.env.VITE_STAGING_API_PREVIEW_HOST;
  if (!webHost || !apiHost || !hostname.endsWith(`-${webHost}`)) {
    return undefined;
  }
  const previewAlias = hostname.slice(0, -webHost.length - 1);
  // Only branch aliases are shared across the web/api workers; per-version
  // preview prefixes are an 8 hex char token, so skip those.
  const isBranchAlias =
    /^[a-z0-9-]+$/.test(previewAlias) && !/^[0-9a-f]{8}$/.test(previewAlias);
  return isBranchAlias ? `https://${previewAlias}-${apiHost}` : undefined;
}

export function getVetroApiUrl(): string | undefined {
  if (typeof window !== "undefined") {
    const derived = deriveApiOrigin(window.location.hostname);
    if (derived) {
      return derived;
    }
  }
  return import.meta.env.VITE_VETRO_API_URL;
}

export function getUrlOrigin(url: string | undefined): string | null {
  try {
    return url ? new URL(url).origin : null;
  } catch {
    return null;
  }
}

export function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

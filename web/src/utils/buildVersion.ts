export async function fetchLiveVersion() {
  try {
    const response = await fetch("/version.json", { cache: "no-store" });
    if (!response.ok) {
      return undefined;
    }
    // The SPA fallback serves index.html with a 200 when the file is missing
    // (e.g. under vite dev), so validate the body before trusting it.
    const data: unknown = await response.json();
    if (
      typeof data === "object" &&
      data !== null &&
      "version" in data &&
      typeof data.version === "string"
    ) {
      return data.version;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export const shouldReloadOnChunkError = ({
  lastReloadedFrom,
  runningVersion,
}: {
  lastReloadedFrom: string | null;
  runningVersion: string;
}) => lastReloadedFrom !== runningVersion;

export const isUpdateAvailable = ({
  liveVersion,
  runningVersion,
}: {
  liveVersion: string | undefined;
  runningVersion: string;
}) => liveVersion !== undefined && liveVersion !== runningVersion;

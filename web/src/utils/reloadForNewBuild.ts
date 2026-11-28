import { shouldReload } from "utils/buildVersion";

const reloadedFromKey = "vetro:reloaded-from";
const runningVersion = import.meta.env.VITE_BUILD_VERSION;

let isReloading = false;

export const isReloadingForNewBuild = () => isReloading;

// Both a failed chunk load and a newly deployed build reload through here.
// One rule guards both: never reload twice from the same running build. It
// covers a chunk that's really missing (the reload runs the same build again)
// and a reload served a cached old index.html (same build again too).
export function reloadForNewBuild() {
  if (isReloading) {
    return true;
  }
  try {
    const lastReloadedFrom = sessionStorage.getItem(reloadedFromKey);
    if (
      !shouldReload({
        isOnline: navigator.onLine,
        lastReloadedFrom,
        runningVersion,
      })
    ) {
      return false;
    }
    sessionStorage.setItem(reloadedFromKey, runningVersion);
  } catch {
    // Without storage the guard can't work, so don't risk a reload loop.
    return false;
  }
  isReloading = true;
  window.location.reload();
  return true;
}

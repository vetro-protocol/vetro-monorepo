import { shouldReloadOnChunkError } from "utils/buildVersion";

const reloadedFromKey = "vetro:preload-error-reloaded-from";
const runningVersion = import.meta.env.VITE_BUILD_VERSION;

function tryMarkReloaded() {
  try {
    const lastReloadedFrom = sessionStorage.getItem(reloadedFromKey);
    if (!shouldReloadOnChunkError({ lastReloadedFrom, runningVersion })) {
      return false;
    }
    sessionStorage.setItem(reloadedFromKey, runningVersion);
    return true;
  } catch {
    return false;
  }
}

// A tab left open across a deploy requests chunks that no longer exist. Reload
// once per build to pick up the new one; if the same build fails again, the
// chunk is really missing, so let the error reach the error page and Sentry.
window.addEventListener("vite:preloadError", function (event) {
  if (!tryMarkReloaded()) {
    return;
  }
  event.preventDefault();
  window.location.reload();
});

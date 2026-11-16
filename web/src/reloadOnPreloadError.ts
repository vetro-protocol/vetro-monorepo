const reloadedKey = "vetro:preload-error-reloaded";

function tryMarkReloaded() {
  try {
    if (sessionStorage.getItem(reloadedKey)) {
      return false;
    }
    sessionStorage.setItem(reloadedKey, "true");
    return true;
  } catch {
    return false;
  }
}

// A tab left open across a deploy requests chunks that no longer exist. Reload
// once per tab session to pick up the new build; if it fails again, let the
// error reach the error page and Sentry.
window.addEventListener("vite:preloadError", function (event) {
  if (!tryMarkReloaded()) {
    return;
  }
  event.preventDefault();
  window.location.reload();
});

import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router";
import { fetchLiveVersion, isUpdateAvailable } from "utils/buildVersion";

const checkIntervalMs = 30 * 60 * 1000;
const reloadTargetKey = "vetro:new-version-reload-target";
const runningVersion = import.meta.env.VITE_BUILD_VERSION;

function tryMarkReloadTarget(liveVersion: string) {
  try {
    if (sessionStorage.getItem(reloadTargetKey) === liveVersion) {
      return false;
    }
    sessionStorage.setItem(reloadTargetKey, liveVersion);
    return true;
  } catch {
    return false;
  }
}

export function ReloadOnNewVersion() {
  const { pathname } = useLocation();
  // A ref, not state: detecting a new version must not re-render the app.
  const pendingVersion = useRef<string | undefined>(undefined);
  const previousPathname = useRef(pathname);

  useEffect(function checkForNewVersion() {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    let unmounted = false;

    async function check() {
      const liveVersion = await fetchLiveVersion();
      if (!unmounted && isUpdateAvailable({ liveVersion, runningVersion })) {
        pendingVersion.current = liveVersion;
      }
    }

    function stopPolling() {
      clearInterval(intervalId);
      intervalId = undefined;
    }

    // Poll only while visible; becoming visible also checks right away.
    function handleVisibilityChange() {
      stopPolling();
      if (document.visibilityState === "visible") {
        check();
        intervalId = setInterval(check, checkIntervalMs);
      }
    }

    if (document.visibilityState === "visible") {
      intervalId = setInterval(check, checkIntervalMs);
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return function () {
      unmounted = true;
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Keyed on pathname only: nuqs writes form state into the query string, so
  // the full location changes while the user types. A layout effect reloads
  // into the page the user navigated to before the old build paints it.
  useLayoutEffect(
    function reloadOnNavigation() {
      if (pathname === previousPathname.current) {
        return;
      }
      previousPathname.current = pathname;
      const liveVersion = pendingVersion.current;
      if (liveVersion && tryMarkReloadTarget(liveVersion)) {
        window.location.reload();
      }
    },
    [pathname],
  );

  return null;
}

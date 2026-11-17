import { useLiveVersion } from "hooks/useLiveVersion";
import { useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router";
import { isUpdateAvailable } from "utils/buildVersion";
import { reloadForNewBuild } from "utils/reloadForNewBuild";

const runningVersion = import.meta.env.VITE_BUILD_VERSION;

export function ReloadOnNewVersion() {
  const { pathname } = useLocation();
  const { data: liveVersion } = useLiveVersion();
  const updateAvailable = isUpdateAvailable({ liveVersion, runningVersion });
  const previousPathname = useRef(pathname);

  // Reloads on navigation, not on detection, so it never interrupts the user.
  // Keyed on pathname only: nuqs writes form state into the query string, so
  // the full location changes while the user types. A layout effect reloads
  // into the page the user navigated to before the old build paints it.
  useLayoutEffect(
    function reloadOnNavigation() {
      if (pathname === previousPathname.current) {
        return;
      }
      previousPathname.current = pathname;
      if (updateAvailable) {
        reloadForNewBuild();
      }
    },
    [pathname, updateAvailable],
  );

  return null;
}

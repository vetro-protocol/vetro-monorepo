import { useLiveVersion } from "hooks/useLiveVersion";
import { normalizePath } from "i18n/path";
import { useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router";
import { isUpdateAvailable } from "utils/buildVersion";
import { reloadForNewBuild } from "utils/reloadForNewBuild";

const runningVersion = import.meta.env.VITE_BUILD_VERSION;

export function ReloadOnNewVersion() {
  const { pathname } = useLocation();
  const normalizedPathname = normalizePath(pathname);
  const { data: liveVersion } = useLiveVersion();
  const updateAvailable = isUpdateAvailable({ liveVersion, runningVersion });
  const previousPathname = useRef(normalizedPathname);

  // Reloads on navigation, not on detection, so it never interrupts the user.
  // Ignore the language prefix and query string: changing the language or
  // typing in a nuqs-backed form should not reload the app. A layout effect
  // reloads into the next page before the old build paints it.
  useLayoutEffect(
    function reloadOnNavigation() {
      if (normalizedPathname === previousPathname.current) {
        return;
      }
      previousPathname.current = normalizedPathname;
      if (updateAvailable) {
        reloadForNewBuild();
      }
    },
    [normalizedPathname, updateAvailable],
  );

  return null;
}

import * as Sentry from "@sentry/react";
import { normalizePath } from "i18n/path";
import { useCallback, useEffect } from "react";
import { useLocation } from "react-router";
import { isReloadingForNewBuild } from "utils/reloadForNewBuild";
import { type Connector, useAccountEffect } from "wagmi";

export function AnalyticsTracker() {
  const { pathname } = useLocation();
  const url = normalizePath(pathname);

  useEffect(
    function trackPageView() {
      if (url !== "/" && !isReloadingForNewBuild()) {
        window.umami?.track((props) => ({ ...props, url }));
      }
    },
    [url],
  );

  useAccountEffect({
    onConnect: useCallback(function ({
      connector,
      isReconnected,
    }: {
      connector: Connector;
      isReconnected: boolean;
    }) {
      Sentry.setTag("evm wallet", connector.name);
      if (!isReconnected) {
        window.umami?.track("evm connected", { wallet: connector.name });
      }
    }, []),
    onDisconnect: useCallback(function () {
      Sentry.setTag("evm wallet", undefined);
    }, []),
  });

  return null;
}

import { lazy } from "react";
import { reloadForNewBuild } from "utils/reloadForNewBuild";

// A tab left open across a deploy requests chunks that no longer exist, so a
// failed load reloads into the new build instead of showing the error page.
export const lazyWithReload: typeof lazy = (factory) =>
  lazy(() =>
    factory().catch(function (error: unknown) {
      if (reloadForNewBuild()) {
        // Never resolves, so the component stays suspended until the reload.
        return new Promise<never>(function () {});
      }
      throw error;
    }),
  );

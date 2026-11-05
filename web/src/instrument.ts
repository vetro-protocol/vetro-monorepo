import * as Sentry from "@sentry/react";
import { reactRouterBrowserTracingIntegration } from "@sentry/react/react-router";

Sentry.init({
  dataCollection: {
    cookies: false,
    httpHeaders: {
      request: { allow: ["referer", "user-agent"] },
      response: false,
    },
    urlQueryParams: { deny: ["forwarded", "-ip", "remote-", "via", "-user"] },
    userInfo: false,
  },
  dsn: import.meta.env.VITE_SENTRY_DSN,
  enabled: !!import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_DEPLOY_ENV,
  integrations: [
    reactRouterBrowserTracingIntegration(),
    Sentry.replayIntegration({
      blockAllMedia: true,
      maskAllInputs: true,
      maskAllText: true,
    }),
  ],
  // Capture 100% of error sessions, sample 10% of all sessions
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  tracesSampleRate: 0.2,
});

import * as Sentry from "@sentry/react";
import React from "react";
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from "react-router";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  enabled: !!import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    Sentry.reactRouterV7BrowserTracingIntegration({
      createRoutesFromChildren,
      matchRoutes,
      useEffect: React.useEffect,
      useLocation,
      useNavigationType,
    }),
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

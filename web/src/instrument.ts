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
  environment: import.meta.env.MODE,
  integrations: [
    Sentry.reactRouterV7BrowserTracingIntegration({
      createRoutesFromChildren,
      matchRoutes,
      useEffect: React.useEffect,
      useLocation,
      useNavigationType,
    }),
    Sentry.replayIntegration(),
  ],
  // Capture 100% of error sessions, sample 10% of all sessions
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  sendDefaultPii: true,
  // Capture 100% of traces in dev, 20% in production
  tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.2,
});

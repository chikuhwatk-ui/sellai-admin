// This file configures the initialization of Sentry on the browser.
// The config you add here will be used whenever a page is visited.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENV || process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || "sellai-admin@0.1.0",

    // Adjust sampling for production cost control.
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      "Non-Error promise rejection captured",
      "Session expired",
    ],

    beforeSend(event) {
      // Strip auth tokens from request data, just in case.
      if (event.request?.headers) {
        const headers = event.request.headers as Record<string, string>;
        if (headers.Authorization) headers.Authorization = "[REDACTED]";
        if (headers.authorization) headers.authorization = "[REDACTED]";
        if (headers.Cookie) headers.Cookie = "[REDACTED]";
        if (headers.cookie) headers.cookie = "[REDACTED]";
      }
      return event;
    },
  });
}

import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // Only enable in production — keeps local dev console clean
    enabled: process.env.NODE_ENV === 'production',

    // Performance tracing — capture 10% of transactions
    tracesSampleRate: 0.1,

    // Capture replays for error sessions only
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0,

    integrations: [
        Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
        }),
    ],
});

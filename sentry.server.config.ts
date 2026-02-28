import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.SENTRY_DSN,

    enabled: process.env.NODE_ENV === 'production',

    // Server-side performance tracing
    tracesSampleRate: 0.1,
});

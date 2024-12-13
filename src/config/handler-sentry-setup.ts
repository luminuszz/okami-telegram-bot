const env = envSchema.parse(process.env);

import * as Sentry from '@sentry/nestjs';

import { envSchema } from '../modules/env/envSchema';

Sentry.init({
  dsn: env.SENTRY_ENDPOINT,
  integrations: [],
  tracesSampleRate: 1.0,
});

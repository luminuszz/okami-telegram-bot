import { z } from 'zod';

export const envSchema = z.object({
  TELEGRAM_NOTIFICATION_BOT: z.string(),
  OKAMI_API_URL: z.string(),
  OKAMI_API_ACCESS_TOKEN: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_KEY_ACCESS: z.string(),
  AWS_REGION: z.string(),
  SENTRY_ENDPOINT: z.string(),
});

export type EnvType = z.infer<typeof envSchema>;

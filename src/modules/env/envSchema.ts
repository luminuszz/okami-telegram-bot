import { z } from "zod";

export const envSchema = z.object({
	TELEGRAM_CLASS_NOTIFICATION_BOT: z.string(),
	TELEGRAM_REMEMBER_REDMINE_BOT: z.string(),
	TELEGRAM_NOTIFICATION_BOT: z.string(),
	OKAMI_API_URL: z.string(),
	OKAMI_API_ACCESS_TOKEN: z.string(),
	AWS_ACCESS_KEY_ID: z.string(),
	AWS_SECRET_KEY_ACCESS: z.string(),
	AWS_REGION: z.string(),
	PORT: z.coerce.number(),
	SUPABASE_SERVICE_ROLE_KEY: z.string(),
	SUPABASE_ANON_KEY: z.string(),
	SUPABASE_URL: z.string().url(),
	REMEMBER_REDMINE_URL: z.string().url(),
	REDIS_URL_CONNECTION: z.string(),
	OPEN_API_KEY: z.string(),
});

export type EnvType = z.infer<typeof envSchema>;

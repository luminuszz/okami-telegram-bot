import { EnvService } from '@modules/env/env.service';
import { Provider } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { CLASS_NOTIFICATION_BOT_PROVIDER, TELEGRAM_PROVIDER } from '.';

export const telegrafProvider: Provider = {
  provide: TELEGRAM_PROVIDER,
  async useFactory(env: EnvService) {
    return new Telegraf(env.get('TELEGRAM_NOTIFICATION_BOT'));
  },
  inject: [EnvService],
};

export const telegrafClassNotificationProviderBot: Provider = {
  provide: CLASS_NOTIFICATION_BOT_PROVIDER,
  async useFactory(env: EnvService) {
    return new Telegraf(env.get('TELEGRAM_CLASS_NOTIFICATION_BOT'));
  },
  inject: [EnvService],
};

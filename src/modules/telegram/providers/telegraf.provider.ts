import { EnvService } from '@modules/env/env.service';
import { Provider } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { TELEGRAM_PROVIDER } from '.';

export const telegrafProvider: Provider = {
  provide: TELEGRAM_PROVIDER,
  async useFactory(env: EnvService) {
    return new Telegraf(env.get('TELEGRAM_NOTIFICATION_BOT'));
  },
  inject: [EnvService],
};

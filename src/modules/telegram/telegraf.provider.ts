import { Provider } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { EnvService } from '../env/env.service';

export const TELEGRAF_PROVIDER = Symbol('TELEGRAF_PROVIDER');

export const telegrafProvider: Provider = {
  provide: TELEGRAF_PROVIDER,
  async useFactory(env: EnvService) {
    return new Telegraf(env.get('TELEGRAM_NOTIFICATION_BOT'));
  },
  inject: [EnvService],
};

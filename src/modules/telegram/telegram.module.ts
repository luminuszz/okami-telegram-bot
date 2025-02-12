import { ClassNotificationBotService } from '@app/modules/telegram/bots/class-notification-bot.service';
import { DatabaseModule } from '@modules/database/database.module';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { EnvModule } from '../env/env.module';
import { OkamiModule } from '../okami/okami.module';
import { TelegramService } from './bots/telegram.service';
import {
  telegrafClassNotificationProviderBot,
  telegrafProvider,
  telegrafRememberRedmineBotProvider,
} from './providers/telegraf.provider';

@Module({
  imports: [EnvModule, OkamiModule, TerminusModule, DatabaseModule],
  providers: [
    telegrafProvider,
    telegrafClassNotificationProviderBot,
    TelegramService,
    telegrafRememberRedmineBotProvider,
    ClassNotificationBotService,
  ],
  exports: [TelegramService],
})
export class TelegramModule {}

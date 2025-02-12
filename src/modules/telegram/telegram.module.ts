import { Module } from '@nestjs/common';
import { EnvModule } from '../env/env.module';
import { OkamiModule } from '../okami/okami.module';
import {
  telegrafClassNotificationProviderBot,
  telegrafProvider,
} from './providers/telegraf.provider';
import { TelegramService } from './telegram.service';
import { TerminusModule } from '@nestjs/terminus';
import { ClassNotificationBotService } from '@modules/telegram/class-notification-bot.service';
import { DatabaseModule } from '@modules/database/database.module';

@Module({
  imports: [EnvModule, OkamiModule, TerminusModule, DatabaseModule],
  providers: [
    telegrafProvider,
    telegrafClassNotificationProviderBot,
    TelegramService,
    ClassNotificationBotService,
  ],
  exports: [TelegramService],
})
export class TelegramModule {}

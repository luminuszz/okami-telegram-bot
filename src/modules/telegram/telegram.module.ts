import { Module } from '@nestjs/common';
import { EnvModule } from '../env/env.module';
import { OkamiModule } from '../okami/okami.module';
import { telegrafProvider } from './telegraf.provider';
import { TelegramService } from './telegram.service';

@Module({
  imports: [EnvModule, OkamiModule],
  providers: [TelegramService, telegrafProvider],
  exports: [TelegramService],
})
export class TelegramModule {}

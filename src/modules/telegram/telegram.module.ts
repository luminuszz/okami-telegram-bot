import { Module } from '@nestjs/common';
import { EnvModule } from '../env/env.module';
import { OkamiModule } from '../okami/okami.module';
import { telegrafProvider } from './providers/telegraf.provider';
import { TelegramService } from './telegram.service';
import { TerminusModule } from '@nestjs/terminus';

@Module({
  imports: [EnvModule, OkamiModule, TerminusModule],
  providers: [TelegramService, telegrafProvider],
  exports: [TelegramService],
})
export class TelegramModule {}

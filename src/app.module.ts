import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { EnvModule } from './modules/env/env.module';
import { OkamiModule } from './modules/okami/okami.module';
import { QueueModule } from './modules/queue/queue.module';
import { TelegramModule } from './modules/telegram/telegram.module';

@Module({
  imports: [EnvModule, QueueModule, OkamiModule, TelegramModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}

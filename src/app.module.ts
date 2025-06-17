import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { EnvModule } from '@app/modules/env/env.module';
import { OkamiModule } from '@modules/okami/okami.module';
import { QueueModule } from '@modules/queue/queue.module';
import { TelegramModule } from '@modules/telegram/telegram.module';
import { TerminusModule } from '@nestjs/terminus';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '@modules/database/database.module';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
    DatabaseModule,
    ScheduleModule.forRoot(),
    TerminusModule,
    EnvModule,
    QueueModule,
    OkamiModule,
    TelegramModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}

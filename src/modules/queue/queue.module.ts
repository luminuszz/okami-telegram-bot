import { Module } from '@nestjs/common';
import { SqsQueueProvider } from './sqs-queue.provider';
import { TerminusModule } from '@nestjs/terminus';
import { BullQueueProvider } from '@modules/queue/bull-queue.provider';
import { RedisProvider } from '@modules/queue/redis-provider';
import { QueueProvider } from '@modules/queue/queue-provider';

@Module({
  imports: [TerminusModule],
  providers: [
    SqsQueueProvider,
    RedisProvider,
    BullQueueProvider,
    { provide: QueueProvider, useClass: BullQueueProvider },
  ],
  exports: [SqsQueueProvider],
})
export class QueueModule {}

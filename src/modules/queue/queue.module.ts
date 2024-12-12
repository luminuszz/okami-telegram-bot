import { Module } from '@nestjs/common';
import { SqsQueueProvider } from './sqs-queue.provider';

@Module({
  providers: [SqsQueueProvider],
  exports: [SqsQueueProvider],
})
export class QueueModule {}

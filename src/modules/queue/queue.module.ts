import { Module } from '@nestjs/common';
import { SqsQueueProvider } from './sqs-queue.provider';
import { TerminusModule } from '@nestjs/terminus';

@Module({
  imports: [TerminusModule],
  providers: [SqsQueueProvider],
  exports: [SqsQueueProvider],
})
export class QueueModule {}

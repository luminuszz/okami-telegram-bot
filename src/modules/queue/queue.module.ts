import { BullQueueProvider } from "@modules/queue/bull-queue.provider";
import { QueueProvider } from "@modules/queue/queue-provider";
import { RedisProvider } from "@modules/queue/redis-provider";
import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";

@Module({
	imports: [TerminusModule],
	providers: [RedisProvider, BullQueueProvider, { provide: QueueProvider, useClass: BullQueueProvider }],
	exports: [QueueProvider],
})
export class QueueModule {}

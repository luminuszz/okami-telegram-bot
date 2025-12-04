import { QueueProvider } from "@modules/queue/queue-provider";
import { REDIS_CONNECTION, RedisClient } from "@modules/queue/redis-provider";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { HealthIndicatorService } from "@nestjs/terminus";
import { HealthIndicatorSession } from "@nestjs/terminus/dist/health-indicator/health-indicator.service";
import { Queue, Worker } from "bullmq";

@Injectable()
export class BullQueueProvider implements QueueProvider {
	private workers = new Map<string, Worker>();
	private queues = new Map<string, Queue>();
	private indicator: HealthIndicatorSession;

	private logger = new Logger(BullQueueProvider.name);

	constructor(
		@Inject(REDIS_CONNECTION)
		private readonly redisClient: RedisClient,
		private readonly healthIndicator: HealthIndicatorService,
	) {
		this.indicator = this.healthIndicator.check("queue_provider");
	}

	async publish<Payload = any>(name: string, payload: Payload): Promise<void> {
		let existsQueue = this.queues.get(name);

		if (!existsQueue) {
			existsQueue = new Queue(name, {
				connection: this.redisClient,
				defaultJobOptions: {
					removeOnComplete: true,
					removeOnFail: false,
					attempts: 3,
					backoff: {
						type: "exponential",
						delay: 1000,
					},
				},
			});
			this.queues.set(name, existsQueue);
		}

		existsQueue.on("error", (err) => this.logger.error(err));
		existsQueue.on("progress", (job) => this.logger.log(`Job ${job.id} completed`));

		await existsQueue.add(name, payload);
	}

	subscribe<Payload = any>(name: string, callback: (payload: Payload) => Promise<void> | void): Promise<void> | void {
		let existsWorker = this.workers.get(name);

		if (!existsWorker) {
			existsWorker = new Worker(
				name,
				async (job) => {
					const payload = job.data as Payload;
					await callback(payload);
				},
				{
					connection: this.redisClient,
				},
			);

			existsWorker.on("error", (err) => this.logger.error(err));
			existsWorker.on("resumed", () => this.logger.log("Worker resumed"));
			existsWorker.on("completed", (job) => this.logger.log(`Job ${job.id} completed`));
			existsWorker.on("failed", (job, err) => this.logger.error(`Job ${job?.id} failed with error: ${err}`));
			existsWorker.on("progress", (job, progress) => this.logger.log(`Job ${job.id} progress: ${progress}`));

			this.workers.set(name, existsWorker);
		}

		this.logger.debug(`Worker ${callback.name}  in job ${name} is subscribed `);
	}

	healthCheck() {
		const checkList: { name: string; active: boolean }[] = [];

		for (const [key, consumer] of this.workers.entries()) {
			checkList.push({
				name: key,
				active: consumer.isRunning(),
			});

			this.logger.debug(`Health check for ${key}: ${consumer.isRunning() ? "UP" : "DOWN"}`);
		}

		const isHeath = checkList.every((check) => check.active);

		return isHeath ? this.indicator.up() : this.indicator.down();
	}
}

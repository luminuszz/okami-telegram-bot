import { TelegramService } from "@app/modules/telegram/bots/telegram.service";
import { EnvService } from "@modules/env/env.service";
import { IaPromptProvider } from "@modules/ia/providers/ia-prompt.provider";
import { QueueProvider } from "@modules/queue/queue-provider";
import { ClassNotificationBotService } from "@modules/telegram/bots/class-notification-bot.service";
import { Controller, Get, type OnModuleInit, Post, Query } from "@nestjs/common";
import { HealthCheck, HealthCheckService, HttpHealthIndicator, MemoryHealthIndicator } from "@nestjs/terminus";
import type { AxiosResponse } from "axios";
import { Utils } from "./utils/parse-message";

interface Notification {
	name: string;
	imageUrl: string;
	chapter: number;
	message: string;
	url: string;
	nextChapter: number;
	workId: string;
	chatId: string;
}

@Controller("/")
export class AppController implements OnModuleInit {
	constructor(
		private readonly queue: QueueProvider,
		private readonly telegramService: TelegramService,
		private readonly healthCheckService: HealthCheckService,
		private memory: MemoryHealthIndicator,
		private http: HttpHealthIndicator,
		private readonly envService: EnvService,
		private readonly classNotificationBot: ClassNotificationBotService,
		private readonly isProvider: IaPromptProvider,
	) {}

	onModuleInit() {
		void this.queue.subscribe("SEND_TELEGRAM_NOTIFICATION", (data) => this.sendUnreadWorkTelegramNotification(data));
	}

	async sendUnreadWorkTelegramNotification(notification: Notification) {
		const { message, url, imageUrl, chatId } = notification;

		const parsedMessage = Utils.parseTelegramMessage(`${message.toString()}\n\n${url}`);

		await this.telegramService.sendMessage({
			message: parsedMessage,
			imageUrl,
			chatId,
		});
	}

	@Get("/debug-sentry")
	getError() {
		throw new Error("My first Sentry error!");
	}

	@HealthCheck()
	@Get("health")
	async healthCheck() {
		return this.healthCheckService.check([
			() => this.telegramService.healthCheck(),
			() => this.queue.healthCheck(),
			() => this.memory.checkHeap("memory_heap", 150 * 1024 * 1024),
			() =>
				this.http.responseCheck(
					"okami_platform_integration",
					`${this.envService.get("OKAMI_API_URL")}/health`,
					(res: AxiosResponse<{ status: string }>) => res.data.status === "ok",
				),
		]);
	}

	@Get("/classroom/daily")
	async fetchClassroomDaily(@Query("weekDay") weekDay?: string) {
		return this.classNotificationBot.getDailyClassByActiveSemester(Number(weekDay));
	}
}

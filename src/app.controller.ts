import { TelegramService } from "@app/modules/telegram/bots/telegram.service";
import { EnvService } from "@modules/env/env.service";
import { IaPromptProvider } from "@modules/ia/providers/ia-prompt.provider";
import { QueueProvider } from "@modules/queue/queue-provider";
import { ClassNotificationBotService } from "@modules/telegram/bots/class-notification-bot.service";
import {
  Controller,
  Get,
  type OnModuleInit,
  Post,
  Query,
} from "@nestjs/common";
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
} from "@nestjs/terminus";
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

export type TracingJobData = {
  type: "errors" | "events" | "logs";
  data: Error | unknown;
};

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
  ) {}

  onModuleInit() {
    void this.queue.subscribe<Notification>(
      "SEND_TELEGRAM_NOTIFICATION",
      (data) => this.sendUnreadWorkTelegramNotification(data),
    );

    void this.queue.subscribe<TracingJobData>("tracing", (data) =>
      this.handleTracingJob(data),
    );
  }

  async handleTracingJob(data: TracingJobData) {
    if (data.type !== "errors") return;

    const error = data.data as Error;

    await this.telegramService.sendMessage({
      chatId: "5887244798",
      message: `🚨 *Error Traced in workers* 🚨\n\n*Name:* ${error.name}\n*Message:* ${error.message}\n*Stack:* \`\`\`${error.stack}\`\`\``,
    });
  }

  async sendUnreadWorkTelegramNotification(notification: Notification) {
    const { message, url, imageUrl, chatId } = notification;

    const parsedMessage = Utils.parseTelegramMessage(
      `${message.toString()}\n\n${url}`,
    );

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
      () => this.queue.healthCheck() as any,
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
    return this.classNotificationBot.getDailyClassByActiveSemester(
      Number(weekDay),
    );
  }
}

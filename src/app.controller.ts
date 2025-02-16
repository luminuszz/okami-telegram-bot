import { TelegramService } from '@app/modules/telegram/bots/telegram.service';
import { EnvService } from '@modules/env/env.service';
import { SqsQueueProvider } from '@modules/queue/sqs-queue.provider';
import { Controller, Get, Logger, OnModuleInit } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { AxiosResponse } from 'axios';
import { Utils } from './utils/parse-message';

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

@Controller('/')
export class AppController implements OnModuleInit {
  constructor(
    private readonly queue: SqsQueueProvider,
    private readonly telegramService: TelegramService,
    private readonly healthCheckService: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private http: HttpHealthIndicator,
    private readonly envService: EnvService,
  ) {}

  private logger = new Logger(AppController.name);

  onModuleInit() {
    void this.queue.subscribe('SEND_TELEGRAM_NOTIFICATION', (data) =>
      this.sendUnreadWorkTelegramNotification(data),
    );
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

  @Get('/debug-sentry')
  getError() {
    throw new Error('My first Sentry error!');
  }

  @HealthCheck()
  @Get('health')
  async healthCheck() {
    return this.healthCheckService.check([
      () => this.telegramService.healthCheck(),
      () => this.queue.healthCheck(),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () =>
        this.http.responseCheck(
          'okami_platform_integration',
          `${this.envService.get('OKAMI_API_URL')}/health`,
          (res: AxiosResponse<{ status: string }>) => res.data.status === 'ok',
        ),
    ]);
  }
}

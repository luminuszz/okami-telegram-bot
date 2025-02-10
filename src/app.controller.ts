import { Controller, Get, Logger, OnModuleInit } from '@nestjs/common';
import { SqsQueueProvider } from '@modules/queue/sqs-queue.provider';
import { TelegramService } from '@modules/telegram/telegram.service';
import { Utils } from './utils/parse-message';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { EnvService } from '@modules/env/env.service';
import { AxiosResponse } from 'axios';

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
    private readonly healtCheckService: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private http: HttpHealthIndicator,
    private readonly envService: EnvService,
  ) {}

  private logger = new Logger(AppController.name);

  onModuleInit() {
    this.logger.log('Listening for SEND_TELEGRAM_NOTIFICATION messages');

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
    return this.healtCheckService.check([
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

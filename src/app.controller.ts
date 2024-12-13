import { Controller, Logger, OnModuleInit } from '@nestjs/common';
import { SqsQueueProvider } from './modules/queue/sqs-queue.provider';
import { TelegramService } from './modules/telegram/telegram.service';
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

@Controller()
export class AppController implements OnModuleInit {
  constructor(
    private readonly queue: SqsQueueProvider,
    private readonly telegramService: TelegramService,
  ) {}

  private logger = new Logger(AppController.name);

  async onModuleInit() {
    this.logger.log('Listening for SEND_TELEGRAM_NOTIFICATION messages');

    this.queue.subscribe('SEND_TELEGRAM_NOTIFICATION', (data) =>
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
}

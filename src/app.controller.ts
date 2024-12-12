import { Controller, OnModuleInit } from '@nestjs/common';
import { SqsQueueProvider } from './modules/queue/sqs-queue.provider';
import { TelegramService } from './modules/telegram/telegram.service';

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

  async onModuleInit() {
    this.queue.subscribe('SEND_TELEGRAM_NOTIFICATION', (data) =>
      this.sendUnreadWorkTelegramNotification(data),
    );
  }

  private parseContent(content: string): string {
    return content
      .replaceAll('_', '\\_')
      .replaceAll('**', '\\**')
      .replaceAll('[', '\\[')
      .replaceAll(']', '\\]')
      .replaceAll('`', '\\`')
      .replaceAll('-', '\\-')
      .replaceAll('(', '\\(')
      .replaceAll(')', '\\)')
      .replaceAll('.', '\\.')
      .replaceAll('!', '\\!')
      .replaceAll('>', '\\>')
      .replaceAll('<', '\\<');
  }

  async sendUnreadWorkTelegramNotification(notification: Notification) {
    const { message, url, imageUrl, chatId } = notification;

    const parsedMessage = this.parseContent(`${message.toString()}\n\n${url}`);

    await this.telegramService.sendMessage({
      message: parsedMessage,
      imageUrl,
      chatId,
    });
  }
}

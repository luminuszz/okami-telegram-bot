import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { OkamiService } from '../okami/okami.service';
import { TELEGRAM_PROVIDER } from './providers';
import {
  SendMessagePayload,
  UserMetadata,
  payloadAthCodeSchema,
  payloadEmailSchema,
} from './utils';
import { HealthIndicatorService } from '@nestjs/terminus';
import { HealthIndicatorSession } from '@nestjs/terminus/dist/health-indicator/health-indicator.service';

@Injectable()
export class TelegramService implements OnModuleInit {
  private memoryUsers = new Map<string, UserMetadata>();

  private logger = new Logger(TelegramService.name);

  private indicator: HealthIndicatorSession;

  constructor(
    private readonly okami: OkamiService,
    @Inject(TELEGRAM_PROVIDER)
    private readonly bot: Telegraf,
    private readonly healthIndicator: HealthIndicatorService,
  ) {}

  onModuleInit() {
    this.indicator = this.healthIndicator.check('telegram_bot');

    this.bot.start(async (ctx) => {
      await ctx.reply('Bem vindo ao Okami Bot Notifier');
      await ctx.reply(
        'Para receber notificações das suas obras favoritas, use o comando /vincularchat',
      );
    });

    this.runVincularChatCommand();
    this.runConfirmarChatCommand();
    this.handleReceivedMessage();

    void this.bot.launch(() => {
      this.logger.debug('Bot is running');
    });
  }

  private handleReceivedMessage() {
    this.bot.on(message('text'), async (ctx) => {
      const isValidEmail = payloadEmailSchema.safeParse(ctx.message.text);

      if (isValidEmail.success) {
        const email = isValidEmail.data;

        await this.okami.sendAuthCodeByEmail({ email });

        this.memoryUsers.set(String(ctx.chat.id), {
          email,
          chatId: String(ctx.chat.id),
          emailSanded: true,
        });

        await ctx.reply(
          `Se **${email}** corresponder aos dados enviaremos um e-mail 
          com o código de acesso  use /confirmarchat e informe o código que você recebeu por e-mail
        
          /confirmarchat
          `,
        );

        return;
      }

      const isValidAuthCode = payloadAthCodeSchema.safeParse(ctx.message.text);

      if (isValidAuthCode.success) {
        const currentUserEmail =
          this.memoryUsers.get(String(ctx.chat.id))?.email ?? '';

        const results = await this.okami.findSubscriberByEmail({
          email: currentUserEmail,
        });

        if (results.isLeft()) {
          await ctx.reply('Email não encontrado');
          return;
        }

        const { subscriber } = results.value;

        const compareResult = await this.okami.compareAuthCode({
          authCode: isValidAuthCode.data,
          userId: subscriber.id,
        });

        if (compareResult.isLeft() || !compareResult.value.isMatch) {
          await ctx.reply('Código inválido');
          return;
        }

        await this.okami.updateTelegramChatId({
          recipientId: subscriber.recipientId,
          telegramChatId: String(ctx.chat.id),
        });

        await ctx.reply(
          `Chat vinculado com sucesso! Você receberá notificações por aqui !`,
        );

        this.memoryUsers.delete(String(ctx.chat.id));

        return;
      }
    });
  }

  private runVincularChatCommand() {
    this.bot.command('vincularchat', async (ctx) => {
      await ctx.reply('Informe seu email na plataforma Okami');
    });
  }

  private runConfirmarChatCommand() {
    this.bot.command('confirmarchat', async (ctx) => {
      await ctx.reply('Informe o código que você recebeu por e-mail');
    });
  }

  async sendMessage({ chatId, message, imageUrl }: SendMessagePayload) {
    const isAllowedImageFiletype = ['png', 'jpg', 'jpeg', 'webp'].includes(
      imageUrl?.split('.')?.pop() ?? '',
    );

    if (imageUrl && isAllowedImageFiletype) {
      await this.bot.telegram.sendPhoto(chatId, imageUrl, {
        caption: message,
        parse_mode: 'MarkdownV2',
      });
    } else {
      await this.bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'MarkdownV2',
      });
    }
  }

  async healthCheck() {
    try {
      const botInfo = await this.bot.telegram.getMe();
      this.logger.debug(`Bot is running. Username: ${botInfo.username}`);
      return this.indicator.up();
    } catch (error) {
      this.logger.error('Bot is not running', error);
      return this.indicator.down(error);
    }
  }
}

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { EnvService } from '../env/env.service';
import { OkamiService } from '../okami/okami.service';
import { TELEGRAF_PROVIDER } from './telegraf.provider';
import {
  SendMessagePayload,
  UserMetadata,
  payloadAthCodeSchema,
  payloadEmailSchema,
} from './utils';

@Injectable()
export class TelegramService implements OnModuleInit {
  private memoryUsers = new Map<string, UserMetadata>();

  constructor(
    private readonly env: EnvService,
    private readonly okami: OkamiService,

    @Inject(TELEGRAF_PROVIDER)
    private readonly bot: Telegraf,
  ) {}
  async onModuleInit() {
    this.bot.start((ctx) => {
      ctx.reply('Bem vindo ao Okami Bot Notifier');
      ctx.reply(
        'Para receber notificações das suas obras favoritas, use o comando /vincularchat',
      );
    });

    this.runVincularChatCommand();
    this.runConfirmarChatCommand();

    this.handleReceivedMessage();

    await this.bot.launch();
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
}

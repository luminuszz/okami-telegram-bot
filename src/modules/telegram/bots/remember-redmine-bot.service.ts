import { RedmineChatRepository } from '@modules/database/repository/redmine-chat.respository';
import { Utils } from '@app/utils/parse-message';
import { TELEGRAM_REMEMBER_REDMINE_BOT_PROVIDER } from '@modules/telegram/providers';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { Cron } from '@nestjs/schedule';
import { format, startOfWeek, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EnvService } from '@modules/env/env.service';

export const EVERY_MONDAY_AT_9AM = '0 9 * * 1';

@Injectable()
export class RememberRedmineBot implements OnModuleInit {
  constructor(
    @Inject(TELEGRAM_REMEMBER_REDMINE_BOT_PROVIDER)
    private readonly bot: Telegraf,

    private readonly redmineChatRepository: RedmineChatRepository,
    private readonly env: EnvService,
  ) {}

  private logger = new Logger(RememberRedmineBot.name);

  async onModuleInit() {
    this.bot.start((ctx) => {
      const message = `
          * Bem-vindo My Redmine notification Bot! * 
          - Para *receber notificações* de novas aulas, use: /vincularchat  
          - Para *parar de receber notificações*, use: /desvincularchat  
          `;

      ctx.reply(Utils.parseTelegramMessage(message), {
        parse_mode: 'MarkdownV2',
      });
    });

    void this.runVincularChatCommand();
    void this.desvincularChatCommand();
    void this.showNotification();

    void this.bot.launch(() => {
      this.logger.debug('Redmine bot Notification bot initialized');
    });
  }

  async showNotification() {
    this.bot.command('notificar', async (ctx, next) => {
      const chat = await this.redmineChatRepository.findByChatId(
        String(ctx.chat.id),
      );

      if (!chat) {
        await ctx.reply(
          'Você não está vinculado a nenhum projeto. Use o comando /vincularchat para vincular um projeto',
        );

        return next();
      }

      await this.showRedmineNotificationByChat(chat.nmProject, chat.chat_id);
    });
  }

  async saveChat(chatId: string, projectName?: string) {
    await this.redmineChatRepository.saveChat(chatId, projectName);
  }

  async deleteChat(chatId: string) {
    await this.redmineChatRepository.deleteByChatId(chatId);
  }

  async runVincularChatCommand() {
    this.bot.command('vincularchat', async (ctx, next) => {
      await ctx.reply(
        'Por favor, me informe o nome do projeto que deseja ser notificado',
      );

      this.bot.on(message('text'), async (ctx, next) => {
        await ctx.reply(
          '⏳ Vinculando seu chat... Por favor, aguarde um momento.',
        );

        const projectName = ctx.message.text;

        await this.saveChat(String(ctx.chat.id), projectName);

        await ctx.reply(
          '✅ Pronto! Seu chat foi vinculado com sucesso. 📲 Agora você receberá um lembrete semanal para preencher o redmine toda segunda, ⏰ 09:00. Fique de olho! 👀',
        );

        await next();
      });

      await next();
    });
  }

  async desvincularChatCommand() {
    this.bot.command('desvincularchat', async (ctx, next) => {
      await this.deleteChat(String(ctx.chat.id));

      await ctx.reply('Chat desvinculado com sucesso!');

      await next();
    });
  }

  private mountRedmineUrl(): string {
    const lastMondayDate = startOfWeek(subWeeks(new Date(), 1), {
      weekStartsOn: 1,
      locale: ptBR,
    });

    const formattedDate = format(lastMondayDate, "yyyy-MM-dd'");

    const url = new URL(this.env.get('REMEMBER_REDMINE_URL'));

    url.searchParams.set('startday', formattedDate);

    this.logger.debug(`Redmine URL: ${url.toString()}`);

    return url.toString();
  }

  private parseClassNotificationMessage(projectName: string): string {
    return Utils.parseTelegramMessage(`
      📌 *Lembrete de preenchimento do Redmine* 📌
      Olá! Não se esqueça de preencher o redmine para o projeto *${projectName}*.
      Acesse o redmine e preencha as informações necessárias.
      `);
  }

  private async showRedmineNotificationByChat(
    nmProject: string,
    chatId: string,
  ) {
    const message = this.parseClassNotificationMessage(nmProject);

    await this.bot.telegram.sendMessage(chatId, message, {
      parse_mode: 'MarkdownV2',
    });

    await this.bot.telegram.sendMessage(
      chatId,
      `[Link do Redmine](${this.mountRedmineUrl()})`,
      {
        parse_mode: 'MarkdownV2',
      },
    );
  }

  @Cron(EVERY_MONDAY_AT_9AM, { timeZone: 'America/Bahia' })
  async runWeekRedmineNotificationJob() {
    for await (const chats of this.redmineChatRepository.getChatsInBatches()) {
      for (const chat of chats) {
        await this.showRedmineNotificationByChat(chat.nmProject, chat.chat_id);
      }
    }
  }
}

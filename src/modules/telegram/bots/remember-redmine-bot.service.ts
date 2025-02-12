import { RedmineChatRepository } from '@app/modules/database/redmine-chat.respository';
import { Utils } from '@app/utils/parse-message';
import { TELEGRAM_REMEMBER_REDMINE_BOT_PROVIDER } from '@modules/telegram/providers';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Telegraf } from 'telegraf';

@Injectable()
export class RememberRedmineBot implements OnModuleInit {
  constructor(
    @Inject(TELEGRAM_REMEMBER_REDMINE_BOT_PROVIDER)
    private readonly bot: Telegraf,

    private readonly redmineChatRepository: RedmineChatRepository,
  ) {}

  private logger = new Logger(RememberRedmineBot.name);

  async onModuleInit() {
    this.logger.debug('Class Notification bot initialized');

    this.bot.start((ctx) => {
      const message = `
          🎓 * Bem-vindo My_Redimine notificaiton   Bot! * 🎓
          - Para *receber notificações* de novas aulas, use: /vincularchat  
          - Para *parar de receber notificações*, use: /desvincularchat  
          - Para *saber qual é a aula de hoje*, use: /aula_hoje  
          `;

      ctx.reply(Utils.parseTelegramMessage(message), {
        parse_mode: 'MarkdownV2',
      });
    });
  }

  async saveChat(chatId: string, projectName?: string) {
    await this.redmineChatRepository.saveChat(chatId, projectName);
  }

  async deleteChat(chatId: string) {
    await this.redmineChatRepository.deleteByChatId(chatId);
  }

  async runVincularChatCommand() {
    this.bot.command('vincularchat', async (ctx) => {
      await ctx.reply(
        'Por favor, me informe o nome do projeto que deseja receber notificações',
      );
    });
  }
}

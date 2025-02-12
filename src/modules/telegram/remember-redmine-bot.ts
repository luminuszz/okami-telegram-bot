import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { TELEGRAM_REMEMBER_REDMINE_BOT_PROVIDER } from '@modules/telegram/providers';
import { Utils } from '@app/utils/parse-message';

@Injectable()
export class RememberRedmineBot implements OnModuleInit {
  constructor(
    @Inject(TELEGRAM_REMEMBER_REDMINE_BOT_PROVIDER)
    private readonly bot: Telegraf,
  ) {}

  private logger = new Logger(RememberRedmineBot.name);

  async onModuleInit() {
    this.logger.debug('Class Notification bot initialized');

    this.bot.start((ctx) => {
      const message = `
          🎓 * Bem-vindo ao Class Notification Bot! * 🎓
          - Para *receber notificações* de novas aulas, use: /vincularchat  
          - Para *parar de receber notificações*, use: /desvincularchat  
          - Para *saber qual é a aula de hoje*, use: /aula_hoje  
          `;

      ctx.reply(Utils.parseTelegramMessage(message), {
        parse_mode: 'MarkdownV2',
      });
    });
  }
}

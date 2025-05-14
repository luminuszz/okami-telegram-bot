import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HealthIndicatorSession } from '@nestjs/terminus/dist/health-indicator/health-indicator.service';
import { CLASS_NOTIFICATION_BOT_PROVIDER } from '@modules/telegram/providers';
import { Telegraf } from 'telegraf';
import { HealthIndicatorService } from '@nestjs/terminus';
import { getDay } from 'date-fns';
import { ClassRoom } from '@app/utils/constants';
import { Utils } from '@app/utils/parse-message';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ChatRepository } from '@modules/database/repository/chat.repository';

@Injectable()
export class ClassNotificationBotService implements OnModuleInit {
  private logger = new Logger(ClassNotificationBotService.name);
  private indicator: HealthIndicatorSession;

  private classes: ClassRoom[];

  constructor(
    @Inject(CLASS_NOTIFICATION_BOT_PROVIDER)
    private readonly bot: Telegraf,
    private readonly healthIndicator: HealthIndicatorService,
    private readonly chatRepository: ChatRepository,
  ) {}

  public async getClassesForActiveSemester() {
    if (!this.classes || this.classes.length === 0) {
      const activeSemester = await this.chatRepository.findActiveSemester();

      this.classes = await this.chatRepository.fetchClassesBySemester(
        activeSemester.id,
      );
    }

    return this.classes;
  }

  onModuleInit() {
    this.logger.debug('Class Notification bot initialized');

    this.indicator = this.healthIndicator.check(
      'class_notification_telegram_bot',
    );

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

    void this.runVincularChatCommand();
    void this.runDesvincularChatCommand();
    void this.whatsTodayClassCommand();

    void this.bot.launch(() => {
      this.logger.log('Bot started class notification bot');
    });
  }

  private async saveChatId(chatId: string) {
    await this.chatRepository.saveChat(chatId);
  }

  private async removeChatId(chatId: string) {
    await this.chatRepository.deleteByChatId(chatId);
  }

  async whatsTodayClassCommand() {
    this.bot.command('aula_hoje', async (ctx) => {
      const chatId = String(ctx.chat.id);

      const currentDayNumber = getDay(new Date());

      const classes = await this.getClassesForActiveSemester();

      const currentClassForDay = classes.find(
        (classItem) => classItem.dayNumber === currentDayNumber,
      );

      if (!currentClassForDay) {
        return ctx.reply('Hoje não tem aula');
      }

      const message = this.parseClassNotificationMessage(currentClassForDay);

      return this.showDayClassByChat(message, chatId);
    });
  }

  async runVincularChatCommand() {
    this.bot.command('vincular_chat', async (ctx) => {
      try {
        await ctx.reply(
          '⏳ Vinculando seu chat... Por favor, aguarde um momento.',
        );

        await this.saveChatId(String(ctx.chat.id));
        await ctx.reply(
          '✅ Pronto! Seu chat foi vinculado com sucesso. 📲 Agora você receberá um lembrete diário das aulas às ⏰ 16:00. Fique de olho! 👀',
        );
      } catch (e) {
        console.error(e);
        await ctx.reply('Erro ao vincular chat');
        this.logger.debug(e);
      }
    });
  }

  async runDesvincularChatCommand() {
    this.bot.command('desvincular_chat', async (ctx) => {
      await this.removeChatId(String(ctx.chat.id));

      await ctx.reply(
        '🔄 Desvinculando seu chat... Por favor, aguarde um instante.',
      );

      await ctx.reply('✅ Chat desvinculado com sucesso! ❌');
      await ctx.reply(
        '🚫 Você não receberá mais notificações de aulas. Se mudar de ideia, é só vincular novamente!',
      );
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_4PM, { timeZone: 'America/Bahia' })
  async runDayClassNotificationJob() {
    const currentDayNumber = getDay(new Date());

    for await (const chats of this.chatRepository.getChatsInBatches()) {
      const classes = await this.getClassesForActiveSemester();

      const currentClassForDay = classes.find(
        (classItem) => classItem.dayNumber === currentDayNumber,
      );

      if (!currentClassForDay) {
        return;
      }

      const message = this.parseClassNotificationMessage(currentClassForDay);

      for (const chat of chats) {
        await this.showDayClassByChat(message, chat.chat_id);
      }
    }
  }

  async showDayClassByChat(message: string, chatId: string) {
    await this.bot.telegram.sendMessage(
      chatId,
      Utils.parseTelegramMessage(message),
      {
        parse_mode: 'MarkdownV2',
      },
    );
  }

  parseClassNotificationMessage(payload: ClassRoom) {
    const message = `
     📚 *Aula de Hoje* 📚
     
    📅 *Dia:* ${payload.day}
    
    🎯 *Disciplina:* ${payload.subject}
    
    👨‍🏫 *Professor:* ${payload.teacher}
    
    🏫 *Sala:* ${payload.room}
`;

    return Utils.parseTelegramMessage(message);
  }
}

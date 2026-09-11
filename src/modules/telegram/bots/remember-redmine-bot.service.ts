import { Utils } from "@app/utils/parse-message";
import { RedmineChatRepository } from "@modules/database/repository/redmine-chat.respository";
import { EnvService } from "@modules/env/env.service";
import { TELEGRAM_REMEMBER_REDMINE_BOT_PROVIDER } from "@modules/telegram/providers";
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { format, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";

export const EVERY_FRIDAY_AT_16_PM = "0 16 * * 5";

@Injectable()
export class RememberRedmineBot implements OnModuleInit, OnModuleDestroy {
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
				parse_mode: "MarkdownV2",
			});
		});

		void this.runVincularChatCommand();
		void this.desvincularChatCommand();
		void this.showNotification();

		const isProd = this.env.get("NODE_ENV") === "production";
		if (isProd) {
			const domain = this.env.get("APP_DOMAIN");
			await this.bot.telegram.setWebhook(`${domain}/webhooks/telegram/redmine`);
			this.logger.debug("Webhook configured for Redmine Bot");
		} else {
			void this.bot.launch(() => {
				this.logger.debug("Redmine bot initialized via Long Polling");
			});
		}
	}

	async onModuleDestroy() {
		await this.bot.stop();
	}

	async showNotification() {
		this.bot.command("notificar", async (ctx, next) => {
			const chat = await this.redmineChatRepository.findByChatId(String(ctx.chat.id));

			if (!chat) {
				await ctx.reply(
					"Você não está vinculado a nenhum projeto. Use o comando /vincularchat para vincular um projeto",
				);

				return next();
			}

			await this.showRedmineNotificationByChat(chat.nmProject ?? "", chat.chat_id);

			return next();
		});
	}

	async saveChat(chatId: string, redmineUserId?: string) {
		await this.redmineChatRepository.saveChat(chatId, redmineUserId);
	}

	async deleteChat(chatId: string) {
		await this.redmineChatRepository.deleteByChatId(chatId);
	}

	async runVincularChatCommand() {
		this.bot.command("vincular_chat", async (ctx, next) => {
			const chatId = String(ctx.chat.id);

			const alreadySaved = await this.redmineChatRepository.findByChatId(chatId);

			console.log("alreadySaved", alreadySaved);

			if (alreadySaved) {
				await ctx.reply(
					"Você já está vinculado a um projeto. Use o comando /desvincular_chat para desvincular o projeto atual",
				);

				return next();
			}

			await ctx.reply(
				"Informe o id usuário do Redmine. Para saber como encontrar o seu id de usuário, clique na imagem abaixo.",
			);

			await ctx.replyWithPhoto({
				filename: "user_id_toutorial.png",
				url: "https://okami-storage.daviribeiro.com/user_id_toutorial.png",
			});

			this.bot.on(message("text"), async (ctx) => {
				await ctx.reply("⏳ Vinculando seu chat... Por favor, aguarde um momento.");

				const projectName = ctx.message.text;

				await this.saveChat(String(ctx.chat.id), projectName);

				await ctx.reply(
					"✅ Pronto! Seu chat foi vinculado com sucesso. 📲 Agora você receberá um lembrete semanal para preencher o redmine toda sexta-feira, ⏰ 16:00. Fique de olho! 👀",
				);

				await next();
			});
		});
	}

	async desvincularChatCommand() {
		this.bot.command("desvincular_chat", async (ctx, next) => {
			await this.deleteChat(String(ctx.chat.id));

			await ctx.reply("Chat desvinculado com sucesso!");

			await next();
		});
	}

	private mountRedmineUrl(redmineUserId: string): string {
		const lastMondayDate = startOfWeek(new Date(), {
			weekStartsOn: 1,
			locale: ptBR,
		});

		const formattedDate = format(lastMondayDate, "yyyy-MM-dd'");

		const url = new URL(this.env.get("REMEMBER_REDMINE_URL"));

		url.searchParams.set("startday", formattedDate);
		url.searchParams.set("user_id", redmineUserId);

		this.logger.debug(`Redmine URL: ${url.toString()}`);

		return url.toString();
	}

	private parseClassNotificationMessage(): string {
		return Utils.parseTelegramMessage(`
      📌 *Lembrete de preenchimento do Redmine* 📌
      Olá! Não se esqueça de preencher o redmine.
      Acesse o redmine e preencha as informações necessárias.
      `);
	}

	private async showRedmineNotificationByChat(redmineChatId: string, chatId: string) {
		const message = this.parseClassNotificationMessage();

		await this.bot.telegram.sendMessage(chatId, message, {
			parse_mode: "MarkdownV2",
		});

		await this.bot.telegram.sendMessage(chatId, `[Link do Redmine](${this.mountRedmineUrl(redmineChatId)})`, {
			parse_mode: "MarkdownV2",
		});
	}

	@Cron(EVERY_FRIDAY_AT_16_PM, { timeZone: "America/Bahia" })
	async runWeekRedmineNotificationJob() {
		for await (const chats of this.redmineChatRepository.getChatsInBatches()) {
			for (const chat of chats) {
				await this.showRedmineNotificationByChat(chat.nmProject ?? "", chat.chat_id);
			}
		}
	}
}

import { Controller, Inject, Post, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { Telegraf } from "telegraf";
import {
	CLASS_NOTIFICATION_BOT_PROVIDER,
	TELEGRAM_PROVIDER,
	TELEGRAM_REMEMBER_REDMINE_BOT_PROVIDER,
} from "./providers";

@Controller("webhooks/telegram")
export class TelegramController {
	constructor(
		@Inject(TELEGRAM_PROVIDER) private readonly okamiBot: Telegraf,
		@Inject(CLASS_NOTIFICATION_BOT_PROVIDER) private readonly classBot: Telegraf,
		@Inject(TELEGRAM_REMEMBER_REDMINE_BOT_PROVIDER) private readonly redmineBot: Telegraf,
	) {}

	@Post("okami")
	async handleOkamiBot(@Req() req: Request, @Res() res: Response) {
		await this.okamiBot.handleUpdate(req.body, res);
	}

	@Post("class")
	async handleClassBot(@Req() req: Request, @Res() res: Response) {
		await this.classBot.handleUpdate(req.body, res);
	}

	@Post("redmine")
	async handleRedmineBot(@Req() req: Request, @Res() res: Response) {
		await this.redmineBot.handleUpdate(req.body, res);
	}
}

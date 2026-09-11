import { ClassNotificationBotService } from "@app/modules/telegram/bots/class-notification-bot.service";
import { RememberRedmineBot } from "@modules/telegram/bots/remember-redmine-bot.service";
import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";
import { EnvModule } from "../env/env.module";
import { OkamiModule } from "../okami/okami.module";
import { TelegramService } from "./bots/telegram.service";
import {
	telegrafClassNotificationProviderBot,
	telegrafProvider,
	telegrafRememberRedmineBotProvider,
} from "./providers/telegraf.provider";
import { TelegramController } from "./telegram.controller";

@Module({
	imports: [EnvModule, OkamiModule, TerminusModule],
	controllers: [TelegramController],
	providers: [
		telegrafProvider,
		telegrafClassNotificationProviderBot,
		telegrafRememberRedmineBotProvider,
		TelegramService,
		ClassNotificationBotService,
		RememberRedmineBot,
	],
	exports: [TelegramService, ClassNotificationBotService],
})
export class TelegramModule {}

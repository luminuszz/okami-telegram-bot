import { ClassNotificationBotService } from "@app/modules/telegram/bots/class-notification-bot.service";
import { RememberRedmineBot } from "@modules/telegram/bots/remember-redmine-bot.service";
import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";
import { EnvModule } from "../env/env.module";
import { OkamiModule } from "../okami/okami.module";
import {
	telegrafClassNotificationProviderBot,
	telegrafProvider,
	telegrafRememberRedmineBotProvider,
} from "./providers/telegraf.provider";

@Module({
	imports: [EnvModule, OkamiModule, TerminusModule],
	providers: [
		telegrafProvider,
		telegrafClassNotificationProviderBot,
		telegrafRememberRedmineBotProvider,
		ClassNotificationBotService,
		RememberRedmineBot,
	],
	exports: [ClassNotificationBotService],
})
export class TelegramModule {}

import { EnvModule } from "@app/modules/env/env.module";
import { DatabaseModule } from "@modules/database/database.module";
import { IaModule } from "@modules/ia/ia.module";
import { OkamiModule } from "@modules/okami/okami.module";
import { QueueModule } from "@modules/queue/queue.module";
import { TelegramModule } from "@modules/telegram/telegram.module";
import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { TerminusModule } from "@nestjs/terminus";
import { ThrottlerModule } from "@nestjs/throttler";
import { AppController } from "./app.controller";
import { FinancesController } from "./finances.controller";

@Module({
	imports: [
		IaModule,
		ThrottlerModule.forRoot({
			throttlers: [
				{
					ttl: 60000,
					limit: 10,
				},
			],
		}),
		DatabaseModule,
		ScheduleModule.forRoot(),
		TerminusModule,
		EnvModule,
		QueueModule,
		OkamiModule,
		TelegramModule,
	],
	controllers: [AppController, FinancesController],
	providers: [],
})
export class AppModule {}

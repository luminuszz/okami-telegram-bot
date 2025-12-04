import { IaPromptProvider, NotificationMobileMessage } from "@modules/ia/providers/ia-prompt.provider";
import { BadRequestException, Body, Controller, Post } from "@nestjs/common";
import { z } from "zod";

@Controller("/finances")
export class FinancesController {
	constructor(private readonly iaProvider: IaPromptProvider) {}

	@Post("/")
	async analyzeNotification(@Body() data: NotificationMobileMessage) {
		const schema = z.object({
			title: z.string(),
			text: z.string(),
			package: z.string(),
		});

		const results = schema.safeParse(data);

		if (!results.success) {
			throw new BadRequestException({
				message: "Invalid schema",
				errors: results.error.errors,
			});
		}

		const analysis = await this.iaProvider.processNotificationMessage(results.data);

		return {
			analysis: {
				...analysis,
			},
		};
	}
}

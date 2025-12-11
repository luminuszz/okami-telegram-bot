import { FinancesService } from "@modules/finances/finances.service";
import { NotificationMobileMessage } from "@modules/ia/providers/ia-prompt.provider";
import { BadRequestException, Body, Controller, Get, Post } from "@nestjs/common";
import { z } from "zod";

@Controller("/finances")
export class FinancesController {
	constructor(private readonly financesService: FinancesService) {}

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

		await this.financesService.saveBalance(results.data);
	}

	@Get("/total")
	async fetchBalancesTotal() {
		return this.financesService.fetchBalancesTotal();
	}

	@Get()
	async fetchBalances() {
		return this.financesService.fetchBalancesHistory();
	}
}

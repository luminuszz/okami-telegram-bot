import { SUPABASE_DATABASE_PROVIDER, SupabaseDatabaseProvider } from "@modules/database/supabase-database.provider";
import { IaPromptProvider, NotificationMobileMessage } from "@modules/ia/providers/ia-prompt.provider";
import { QueueProvider } from "@modules/queue/queue-provider";
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";

@Injectable()
export class FinancesService implements OnModuleInit {
	constructor(
		@Inject(SUPABASE_DATABASE_PROVIDER)
		private readonly supabase: SupabaseDatabaseProvider,
		private readonly iaPromptProvider: IaPromptProvider,
		private readonly queueProvider: QueueProvider,
	) {}

	private readonly saveBalanceQueue = "finances.save-balance";

	onModuleInit() {
		this.queueProvider.subscribe<NotificationMobileMessage>(this.saveBalanceQueue, this.executeSaveBalanace.bind(this));
	}

	private logger = new Logger(this.constructor.name);

	private async executeSaveBalanace(notification: NotificationMobileMessage) {
		const analysis = await this.iaPromptProvider.processNotificationMessage(notification);

		this.logger.debug(analysis);

		if (analysis.type === "no_financial") {
			return;
		}

		await this.supabase.from("balances").insert({
			amount: analysis.amount,
			balance: analysis.balance,
			created_at: new Date().toISOString(),
			currency: analysis.currency,
			description: analysis.description,
			raw: JSON.stringify(analysis.raw),
			source: analysis.source,
			timestamp: new Date().toISOString(),
			type: analysis.type,
		});
	}

	async saveBalance(notification: NotificationMobileMessage) {
		await this.queueProvider.publish(this.saveBalanceQueue, notification);
	}

	async fetchBalancesTotal() {
		const defaultValues = {
			incress: 0,
			decress: 0,
		};

		const { data, error } = await this.supabase
			.from("balances")
			.select("*")
			.filter("balance", "not.eq", null)
			.order("created_at", { ascending: false });

		if (error) {
			throw new Error(`Failed to fetch balances: ${error.message}`);
		}

		if (!data) {
			return defaultValues;
		}

		const results = data?.reduce((acc, current) => {
			if (current.balance && current.amount) {
				acc[current.balance] = (acc[current.balance] ?? 0) + current.amount;
			}

			return acc;
		}, defaultValues);

		this.logger.debug(results);

		return {
			incress: results.incress / 100,
			decress: results.decress / 100,
			balance: (results.incress - results.decress) / 100,
		};
	}

	async fetchBalancesHistory() {
		const { data, error } = await this.supabase
			.from("balances")
			.select("*")
			.filter("balance", "not.eq", null)
			.order("created_at", { ascending: false });

		if (error) throw new Error(`Failed to fetch balances: ${error.message}`);

		return data?.length ? data : [];
	}
}

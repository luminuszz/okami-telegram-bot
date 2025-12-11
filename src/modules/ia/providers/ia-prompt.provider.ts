export interface NotificationMobileMessage {
	title: string;
	text: string;
	package: string;
}

export const NotificationType = {
	PixReceived: "pix_received",
	PixSent: "pix_sent",
	CardPurchase: "card_purchase",
	Refund: "refund",
	Transfer: "transfer",
	Balance: "balance",
	Payment: "payment",
	Invoice: "invoice",
	Alert: "alert",
	NotFinancial: "no_financial",
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export interface TransactionNotification {
	type: NotificationType;
	amount: number | null;
	currency: "BRL" | string;
	source?: string;
	description?: string;
	timestamp: string; // ISO 8601
	raw: string;
	balance: "incress" | "decress";
}

export abstract class IaPromptProvider {
	abstract processNotificationMessage(message: NotificationMobileMessage): Promise<TransactionNotification>;
}

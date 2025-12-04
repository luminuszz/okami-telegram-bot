import { EnvService } from "@modules/env/env.service";
import type {
	IaPromptProvider,
	NotificationMobileMessage,
	TransactionNotification,
} from "@modules/ia/providers/ia-prompt.provider";
import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import OpenAI from "openai";

@Injectable()
export class OpenAiPromptProvider implements IaPromptProvider, OnModuleInit {
	private client!: OpenAI;

	constructor(private readonly env: EnvService) {}

	private readonly model = "gpt-4.1-mini";

	onModuleInit() {
		this.client = new OpenAI({ apiKey: this.env.get("OPEN_API_KEY") });
	}

	private generatePrompt(message: NotificationMobileMessage): string {
		return `
    Você deve analisar notificações bancárias do Android e devolver SEMPRE um JSON válido.
    Identifique tipo de evento: pix_received, pix_sent, card_purchase, refund, transfer, balance, payment, invoice, alert
    Se o <timestamp> não estiver explícito, gerar timestamp UTC atual
    Use "BRL" como moeda padrão.
    Use o campo <fonte> para indicar o nome do banco, se possível.
    Resuma o texto original no campo <descricao>.
    Retorne o ammount em centavos (100 = R$1,00).

    Saídas MUST:
    {
        "type": "...",
        "amount": null,
        "currency": "BRL",
        "source": "bank name if known",
        "description": "summarized original text",
        "timestamp": "<ISO>",
        "raw": "<original text>"
    }

    Determine valor sempre que aparecer no texto.
    Se a notificação não for financeira, devolva:
    {
      "tipo": "nao_financeiro",
      "raw": "<texto original>"
    }
    Notificação: ${JSON.stringify(message)}
`;
	}

	private logger = new Logger(this.constructor.name);

	async processNotificationMessage(message: NotificationMobileMessage): Promise<TransactionNotification> {
		const response = await this.client.chat.completions.create({
			model: this.model,
			messages: [{ role: "user", content: this.generatePrompt(message) }],
		});

		this.logger.debug(response.choices);

		const content = response.choices[0].message.content;

		if (!content) {
			throw new Error("No content returned from OpenAI");
		}

		return JSON.parse(content.replace(/```json|```/g, "").trim()) as TransactionNotification;
	}
}

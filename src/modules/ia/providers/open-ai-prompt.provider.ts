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
    Preciso que você seja muito preciso na identificação do tipo de notificação.
    Exemplo de notificação financeira:
    "Você recebeu um PIX de R$150,00 de João Silva. Saldo atual R$1.250,00"
    Exemplo de notificação não financeira:
    "Seu código de verificação é 123456. Não compartilhe com ninguém."
    Preciso que você identifique se  notficação financeira foi de entrada ou saída de dinheiro.
    Se for entrada, use tipos: pix_received, refund
    Se for saída, use tipos: pix_sent, card_purchase, transfer, payment, invoice
    Se for apenas um alerta sem movimentação financeira, use tipo: alert


    Saídas MUST:
    {
        "type": "...",
        "amount": null,
        "currency": "BRL",
        "source": "bank name if known",
        "description": "summarized original text",
        "timestamp": "<ISO>",
        "raw": "<original text>"
        balance: <Informe se e do tipo "incress" ou "decress">
    }

    Determine valor sempre que aparecer no texto.
    Se a notificação não for financeira, devolva:
    {
      "type": "no_financial",
      "amount": null,
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

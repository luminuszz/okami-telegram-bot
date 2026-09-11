import { Telegraf } from "telegraf";
import { RedmineChatRepository } from "../../database/repository/redmine-chat.respository";
import { EnvService } from "../../env/env.service";
import { RememberRedmineBot } from "./remember-redmine-bot.service";

describe("RememberRedmineBot", () => {
	let service: RememberRedmineBot;
	let mockBot: {
		start: jest.Mock;
		command: jest.Mock;
		on: jest.Mock;
		launch: jest.Mock;
		stop: jest.Mock;
		telegram: {
			setWebhook: jest.Mock;
			sendMessage: jest.Mock;
		};
	};
	let mockRedmineChatRepository: Partial<RedmineChatRepository>;
	let mockEnv: { get: jest.Mock };

	beforeEach(() => {
		mockBot = {
			start: jest.fn(),
			command: jest.fn(),
			on: jest.fn(),
			launch: jest.fn(),
			stop: jest.fn(),
			telegram: {
				setWebhook: jest.fn().mockResolvedValue(true),
				sendMessage: jest.fn().mockResolvedValue(true),
			},
		};

		mockRedmineChatRepository = {
			findByChatId: jest.fn(),
			saveChat: jest.fn(),
			deleteByChatId: jest.fn(),
		};

		mockEnv = {
			get: jest.fn(),
		};

		service = new RememberRedmineBot(
			mockBot as unknown as Telegraf,
			mockRedmineChatRepository as RedmineChatRepository,
			mockEnv as unknown as EnvService,
		);
	});

	describe("onModuleInit", () => {
		it("should configure webhook when NODE_ENV is production", async () => {
			mockEnv.get.mockImplementation((key: string) => {
				if (key === "NODE_ENV") return "production";
				if (key === "APP_DOMAIN") return "https://api.example.com";
				return "";
			});

			await service.onModuleInit();

			expect(mockBot.telegram.setWebhook).toHaveBeenCalledWith("https://api.example.com/webhooks/telegram/redmine");
			expect(mockBot.launch).not.toHaveBeenCalled();
		});

		it("should launch long polling when NODE_ENV is not production", async () => {
			mockEnv.get.mockImplementation((key: string) => {
				if (key === "NODE_ENV") return "development";
				return "";
			});

			await service.onModuleInit();

			expect(mockBot.launch).toHaveBeenCalled();
			expect(mockBot.telegram.setWebhook).not.toHaveBeenCalled();
		});
	});
});

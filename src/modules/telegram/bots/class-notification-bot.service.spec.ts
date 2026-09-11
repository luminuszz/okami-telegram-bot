import { Telegraf } from "telegraf";
import { ChatRepository } from "../../database/repository/chat.repository";
import { EnvService } from "../../env/env.service";
import { ClassNotificationBotService } from "./class-notification-bot.service";

describe("ClassNotificationBotService", () => {
	let service: ClassNotificationBotService;
	let mockBot: {
		start: jest.Mock;
		command: jest.Mock;
		launch: jest.Mock;
		telegram: {
			setWebhook: jest.Mock;
		};
	};
	let mockChatRepository: Partial<ChatRepository>;
	let mockEnv: { get: jest.Mock };

	beforeEach(() => {
		mockBot = {
			start: jest.fn(),
			command: jest.fn(),
			launch: jest.fn(),
			telegram: {
				setWebhook: jest.fn().mockResolvedValue(true),
			},
		};

		mockChatRepository = {
			findActiveSemester: jest.fn(),
			fetchClassesBySemester: jest.fn(),
			saveChat: jest.fn(),
			deleteByChatId: jest.fn(),
		};

		mockEnv = {
			get: jest.fn(),
		};

		service = new ClassNotificationBotService(
			mockBot as unknown as Telegraf,
			mockChatRepository as ChatRepository,
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

			expect(mockBot.telegram.setWebhook).toHaveBeenCalledWith("https://api.example.com/webhooks/telegram/class");
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

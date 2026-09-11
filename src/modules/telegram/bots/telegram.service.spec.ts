import { HealthIndicatorService } from "@nestjs/terminus";
import type { HealthIndicatorSession } from "@nestjs/terminus/dist/health-indicator/health-indicator.service";
import { Telegraf } from "telegraf";
import { EnvService } from "../../env/env.service";
import { OkamiService } from "../../okami/okami.service";
import { TelegramService } from "./telegram.service";

describe("TelegramService", () => {
	let service: TelegramService;
	let mockBot: {
		start: jest.Mock;
		command: jest.Mock;
		on: jest.Mock;
		launch: jest.Mock;
		stop: jest.Mock;
		telegram: {
			setWebhook: jest.Mock;
			sendMessage: jest.Mock;
			sendPhoto: jest.Mock;
			sendAnimation: jest.Mock;
			getMe: jest.Mock;
		};
	};
	let mockOkami: Partial<OkamiService>;
	let mockHealthIndicator: Partial<HealthIndicatorService>;
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
				sendPhoto: jest.fn().mockResolvedValue(true),
				sendAnimation: jest.fn().mockResolvedValue(true),
				getMe: jest.fn().mockResolvedValue({}),
			},
		};

		mockOkami = {
			sendAuthCodeByEmail: jest.fn(),
			findSubscriberByEmail: jest.fn(),
			compareAuthCode: jest.fn(),
			updateTelegramChatId: jest.fn(),
			fetchSubscribersByChatId: jest.fn(),
			deleteTelegramChatId: jest.fn(),
		};

		mockHealthIndicator = {
			check: jest.fn().mockReturnValue({
				up: jest.fn(),
				down: jest.fn(),
			} as unknown as HealthIndicatorSession),
		};

		mockEnv = {
			get: jest.fn(),
		};

		service = new TelegramService(
			mockOkami as OkamiService,
			mockBot as unknown as Telegraf,
			mockHealthIndicator as HealthIndicatorService,
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

			expect(mockBot.telegram.setWebhook).toHaveBeenCalledWith("https://api.example.com/webhooks/telegram/okami");
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

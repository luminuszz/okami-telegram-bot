import { Test, TestingModule } from "@nestjs/testing";
import type { Request, Response } from "express";
import {
	CLASS_NOTIFICATION_BOT_PROVIDER,
	TELEGRAM_PROVIDER,
	TELEGRAM_REMEMBER_REDMINE_BOT_PROVIDER,
} from "./providers";
import { TelegramController } from "./telegram.controller";

describe("TelegramController", () => {
	let controller: TelegramController;
	let mockOkamiBot: { handleUpdate: jest.Mock };
	let mockClassBot: { handleUpdate: jest.Mock };
	let mockRedmineBot: { handleUpdate: jest.Mock };

	beforeEach(async () => {
		mockOkamiBot = { handleUpdate: jest.fn().mockResolvedValue(true) };
		mockClassBot = { handleUpdate: jest.fn().mockResolvedValue(true) };
		mockRedmineBot = { handleUpdate: jest.fn().mockResolvedValue(true) };

		const module: TestingModule = await Test.createTestingModule({
			controllers: [TelegramController],
			providers: [
				{ provide: TELEGRAM_PROVIDER, useValue: mockOkamiBot },
				{ provide: CLASS_NOTIFICATION_BOT_PROVIDER, useValue: mockClassBot },
				{ provide: TELEGRAM_REMEMBER_REDMINE_BOT_PROVIDER, useValue: mockRedmineBot },
			],
		}).compile();

		controller = module.get<TelegramController>(TelegramController);
	});

	it("should call handleUpdate on okami bot", async () => {
		const req = { body: { update_id: 1 } } as unknown as Request;
		const res = {} as unknown as Response;
		await controller.handleOkamiBot(req, res);
		expect(mockOkamiBot.handleUpdate).toHaveBeenCalledWith(req.body, res);
		expect(mockClassBot.handleUpdate).not.toHaveBeenCalled();
		expect(mockRedmineBot.handleUpdate).not.toHaveBeenCalled();
	});

	it("should call handleUpdate on class bot", async () => {
		const req = { body: { update_id: 2 } } as unknown as Request;
		const res = {} as unknown as Response;
		await controller.handleClassBot(req, res);
		expect(mockClassBot.handleUpdate).toHaveBeenCalledWith(req.body, res);
		expect(mockOkamiBot.handleUpdate).not.toHaveBeenCalled();
		expect(mockRedmineBot.handleUpdate).not.toHaveBeenCalled();
	});

	it("should call handleUpdate on redmine bot", async () => {
		const req = { body: { update_id: 3 } } as unknown as Request;
		const res = {} as unknown as Response;
		await controller.handleRedmineBot(req, res);
		expect(mockRedmineBot.handleUpdate).toHaveBeenCalledWith(req.body, res);
		expect(mockOkamiBot.handleUpdate).not.toHaveBeenCalled();
		expect(mockClassBot.handleUpdate).not.toHaveBeenCalled();
	});
});

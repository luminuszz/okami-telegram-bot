# Telegram Webhook Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate three Telegram bots from Long Polling to Webhooks in production environments, keeping Long Polling for development.

**Architecture:** Create a new NestJS `TelegramController` exposing three endpoints (one for each bot). The services will dynamically configure the Telegram webhook on module initialization if running in production, or fallback to polling otherwise.

**Tech Stack:** NestJS, Telegraf, TypeScript, Jest.

**Spec:** file:///home/daviribeiro/.gemini/antigravity-cli/brain/9f09acef-380a-4c2e-82fa-8e7c935c9971/MIGRACAO_WEBHOOK_TELEGRAM.md

## Global Constraints

- Must maintain backward compatibility for local development (Long Polling).
- Webhook routes must map `req.body` directly to `bot.handleUpdate`.
- Fast response (200 OK) is required by Telegram.

---

### Task 1: Create Telegram Webhook Controller

**Files:**
- Create: `src/modules/telegram/telegram.controller.ts`
- Create: `src/modules/telegram/telegram.controller.spec.ts`

**Interfaces:**
- Consumes: `Telegraf` instances from `telegram/providers`
- Produces: HTTP endpoints `POST /webhooks/telegram/okami`, `/class`, `/redmine`

- [ ] **Step 1: Write the failing test**

```typescript
// src/modules/telegram/telegram.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TelegramController } from './telegram.controller';
import {
  TELEGRAM_PROVIDER,
  CLASS_NOTIFICATION_BOT_PROVIDER,
  TELEGRAM_REMEMBER_REDMINE_BOT_PROVIDER,
} from './providers';

describe('TelegramController', () => {
  let controller: TelegramController;
  let mockTelegraf: any;

  beforeEach(async () => {
    mockTelegraf = { handleUpdate: jest.fn().mockResolvedValue(true) };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TelegramController],
      providers: [
        { provide: TELEGRAM_PROVIDER, useValue: mockTelegraf },
        { provide: CLASS_NOTIFICATION_BOT_PROVIDER, useValue: mockTelegraf },
        { provide: TELEGRAM_REMEMBER_REDMINE_BOT_PROVIDER, useValue: mockTelegraf },
      ],
    }).compile();

    controller = module.get<TelegramController>(TelegramController);
  });

  it('should call handleUpdate on okami bot', async () => {
    const req = { body: { update_id: 1 } } as any;
    const res = {} as any;
    await controller.handleOkamiBot(req, res);
    expect(mockTelegraf.handleUpdate).toHaveBeenCalledWith(req.body, res);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/modules/telegram/telegram.controller.spec.ts`
Expected: FAIL with "Cannot find module './telegram.controller'"

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/modules/telegram/telegram.controller.ts
import { Controller, Post, Req, Res, Inject } from '@nestjs/common';
import { Request, Response } from 'express';
import { Telegraf } from 'telegraf';
import {
  TELEGRAM_PROVIDER,
  CLASS_NOTIFICATION_BOT_PROVIDER,
  TELEGRAM_REMEMBER_REDMINE_BOT_PROVIDER,
} from './providers';

@Controller('webhooks/telegram')
export class TelegramController {
  constructor(
    @Inject(TELEGRAM_PROVIDER) private okamiBot: Telegraf,
    @Inject(CLASS_NOTIFICATION_BOT_PROVIDER) private classBot: Telegraf,
    @Inject(TELEGRAM_REMEMBER_REDMINE_BOT_PROVIDER) private redmineBot: Telegraf,
  ) {}

  @Post('okami')
  async handleOkamiBot(@Req() req: Request, @Res() res: Response) {
    await this.okamiBot.handleUpdate(req.body, res);
  }

  @Post('class')
  async handleClassBot(@Req() req: Request, @Res() res: Response) {
    await this.classBot.handleUpdate(req.body, res);
  }

  @Post('redmine')
  async handleRedmineBot(@Req() req: Request, @Res() res: Response) {
    await this.redmineBot.handleUpdate(req.body, res);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/modules/telegram/telegram.controller.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/modules/telegram/telegram.controller.ts src/modules/telegram/telegram.controller.spec.ts
git commit -m "feat: add telegram webhook controller"
```

---

### Task 2: Update TelegramModule

**Files:**
- Modify: `src/modules/telegram/telegram.module.ts:14-25`

**Interfaces:**
- Consumes: `TelegramController`

- [ ] **Step 1: Write minimal implementation**

```typescript
// src/modules/telegram/telegram.module.ts
import { TelegramController } from './telegram.controller';
// ...
@Module({
	imports: [EnvModule, OkamiModule, TerminusModule],
    controllers: [TelegramController],
	providers: [
		telegrafProvider,
		telegrafClassNotificationProviderBot,
		telegrafRememberRedmineBotProvider,
		TelegramService,
		ClassNotificationBotService,
		RememberRedmineBot,
	],
	exports: [TelegramService, ClassNotificationBotService],
})
export class TelegramModule {}
```

- [ ] **Step 2: Verify it passes**

Run: `npx tsc --noEmit`
Expected: Exits 0, no compilation errors.

- [ ] **Step 3: Commit**

```bash
git add src/modules/telegram/telegram.module.ts
git commit -m "refactor: register TelegramController in TelegramModule"
```

---

### Task 3: Refactor TelegramService initialization

**Files:**
- Modify: `src/modules/telegram/bots/telegram.service.ts`

**Interfaces:**
- Consumes: `EnvService` to check environment variables

- [ ] **Step 1: Write minimal implementation**

```typescript
// src/modules/telegram/bots/telegram.service.ts
import { EnvService } from '../../env/env.service';
// ...
  constructor(
    private readonly okami: OkamiService,
    @Inject(TELEGRAM_PROVIDER) private readonly bot: Telegraf,
    private readonly healthIndicator: HealthIndicatorService,
    private readonly env: EnvService, // Inject EnvService
  ) {}

  async onModuleInit() {
    this.indicator = this.healthIndicator.check("telegram_bot");
    // ... setup bot commands (this.bot.start, etc.)

    const isProd = this.env.get('NODE_ENV') === 'production';
    if (isProd) {
      const domain = this.env.get('APP_DOMAIN');
      await this.bot.telegram.setWebhook(`${domain}/webhooks/telegram/okami`);
      this.logger.debug("Webhook configured for Okami Bot");
    } else {
      void this.bot.launch(() => {
        this.logger.debug("Okami Bot is running via Long Polling");
      });
    }
  }
```

- [ ] **Step 2: Verify it passes**

Run: `npx tsc --noEmit`
Expected: Exits 0

- [ ] **Step 3: Commit**

```bash
git add src/modules/telegram/bots/telegram.service.ts
git commit -m "feat: setup webhook configuration for Okami Bot"
```

---

### Task 4: Refactor Class Notification Bot and Redmine Bot initialization

**Files:**
- Modify: `src/modules/telegram/bots/class-notification-bot.service.ts`
- Modify: `src/modules/telegram/bots/remember-redmine-bot.service.ts`

**Interfaces:**
- Consumes: `EnvService`

- [ ] **Step 1: Write minimal implementation**

```typescript
// src/modules/telegram/bots/class-notification-bot.service.ts
import { EnvService } from '../../env/env.service';
// ...
	constructor(
		@Inject(CLASS_NOTIFICATION_BOT_PROVIDER) private readonly bot: Telegraf,
		private readonly chatRepository: ChatRepository,
        private readonly env: EnvService, // Inject EnvService
	) {}

    async onModuleInit() {
       // ... setup bot commands
       const isProd = this.env.get('NODE_ENV') === 'production';
       if (isProd) {
           const domain = this.env.get('APP_DOMAIN');
           await this.bot.telegram.setWebhook(`${domain}/webhooks/telegram/class`);
           this.logger.log("Webhook configured for Class Bot");
       } else {
           void this.bot.launch(() => {
               this.logger.log("Class bot started via Long Polling");
           });
       }
    }
```

```typescript
// src/modules/telegram/bots/remember-redmine-bot.service.ts
// Add EnvService logic in onModuleInit (EnvService is already injected)
    async onModuleInit() {
        // ... setup commands
        const isProd = this.env.get('NODE_ENV') === 'production';
        if (isProd) {
            const domain = this.env.get('APP_DOMAIN');
            await this.bot.telegram.setWebhook(`${domain}/webhooks/telegram/redmine`);
            this.logger.debug("Webhook configured for Redmine Bot");
        } else {
            void this.bot.launch(() => {
                this.logger.debug("Redmine bot initialized via Long Polling");
            });
        }
    }
```

- [ ] **Step 2: Verify it passes**

Run: `npx tsc --noEmit`
Expected: Exits 0

- [ ] **Step 3: Commit**

```bash
git add src/modules/telegram/bots/class-notification-bot.service.ts src/modules/telegram/bots/remember-redmine-bot.service.ts
git commit -m "feat: setup webhook config for Class and Redmine Bots"
```

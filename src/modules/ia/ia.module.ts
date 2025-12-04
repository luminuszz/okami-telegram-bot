import { IaPromptProvider } from "@modules/ia/providers/ia-prompt.provider";
import { OpenAiPromptProvider } from "@modules/ia/providers/open-ai-prompt.provider";
import { Module } from "@nestjs/common";

@Module({
	providers: [
		OpenAiPromptProvider,
		{
			provide: IaPromptProvider,
			useExisting: OpenAiPromptProvider,
		},
	],
	exports: [IaPromptProvider],
})
export class IaModule {}

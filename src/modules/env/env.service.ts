import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EnvType } from "./envSchema";

@Injectable()
export class EnvService {
	constructor(private readonly configService: ConfigService<EnvType>) {}

	public get<EnvKey extends keyof EnvType>(envKey: EnvKey): EnvType[EnvKey] {
		return this.configService.get(envKey, { infer: true }) as EnvType[EnvKey];
	}
}

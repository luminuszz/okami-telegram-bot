import { EnvService } from "@modules/env/env.service";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	const env = app.get(EnvService);
	app.enableCors();

	app.use(
		helmet({
			crossOriginEmbedderPolicy: false,
			contentSecurityPolicy: {
				directives: {
					imgSrc: [`'self'`, "data:", "apollo-server-landing-page.cdn.apollographql.com"],
					scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
					manifestSrc: [`'self'`, "apollo-server-landing-page.cdn.apollographql.com"],
					frameSrc: [`'self'`, "sandbox.embed.apollographql.com"],
				},
			},
		}),
	);

	await app.listen(env.get("PORT"));
}
void bootstrap();

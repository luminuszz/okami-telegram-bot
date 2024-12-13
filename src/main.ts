import './config/handler-sentry-setup';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  (await NestFactory.create(AppModule)).listen(3000);
}
bootstrap();

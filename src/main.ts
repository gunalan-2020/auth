import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>('FRONTEND_URL');

  app.set('trust proxy', 1);
  app.use(cookieParser());
  app.enableCors({
    origin: frontendUrl, // Adjust based on frontend URL
    credentials: true, // Allows cookies
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

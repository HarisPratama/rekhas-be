import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import {ValidationPipe} from "@nestjs/common";
import * as process from 'node:process';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true, // 👈 this is the key!
        transformOptions: { enableImplicitConversion: true },
      }),
  );
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/', // must match your image_url
  });
  app.useStaticAssets(join(__dirname, '..', 'public'));

  await app.listen(process.env.PORT);
}
bootstrap();

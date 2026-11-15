import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Every route lives under /api, the same path the browser uses. That lets the
  // tunnel send /api/* straight to this service (cloudflared matches paths but
  // cannot rewrite them), and keeps the Next.js rewrite as a pass-through.
  app.setGlobalPrefix('api');
  app.use(helmet());
  // Nothing is cacheable unless a handler says so. The two public lists opt in
  // with @Header('Cache-Control', PUBLIC_LIST_CACHE), which replaces this. Any
  // edge-cache rule that matches too broadly then still cannot store a signed-in
  // response and serve it to someone else.
  app.use((_req: unknown, res: { setHeader(k: string, v: string): void }, next: () => void) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use(json({ limit: '2mb' }));
  app.use(urlencoded({ extended: true, limit: '2mb' }));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000', credentials: true });

  const config = new DocumentBuilder()
    .setTitle('Disruptors Movement API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));

  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port);
  console.log(`API listening on port ${port}`);
}
bootstrap();

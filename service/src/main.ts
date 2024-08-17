import * as Dotenv from 'dotenv';
Dotenv.config({ path: '.env' });
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createSwagger } from '@/common/swagger';
import { AllExceptionsFilter } from '@/common/filters/allExceptions.filter';
import { TypeOrmQueryFailedFilter } from '@/common/filters/typeOrmQueryFailed.filter';
import { ValidationPipe, Logger } from '@nestjs/common';
import { TransformInterceptor } from '@/common/interceptors/transform.interceptor';
import { join } from 'path';
import * as express from 'express';
import { PORT, APIPREFIX } from '@/config/main';
import { initDatabase } from '@/modules/database/initDatabase';
import * as compression from 'compression';
import * as xmlBodyParser from 'express-xml-bodyparser';
import { resolve } from 'path';
import { I18nValidationPipe } from 'nestjs-i18n';
import { I18nValidationExceptionFilter } from 'nestjs-i18n';

async function bootstrap() {
  await initDatabase();
  const app = await NestFactory.create(AppModule);
  app.use(compression());
  const www = resolve(__dirname, './public');
  app.use(xmlBodyParser());
  app.enableCors();
  app.setGlobalPrefix(APIPREFIX);
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new TypeOrmQueryFailedFilter());
  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(new I18nValidationPipe());
  app.useGlobalFilters(new I18nValidationExceptionFilter({ detailedErrors: true }));
  Logger.debug('Global pipes and filters set up');

  app.getHttpAdapter().getInstance().set('views', 'templates/pages');
  app.getHttpAdapter().getInstance().set('view engine', 'hbs');

  createSwagger(app);
  const server = await app.listen(PORT, () => {
    Logger.log(`서비스 구동완료: http://localhost:${PORT}/hhuu/docs`, 'Main');
  });
  server.timeout = 5 * 60 * 1000;
}

bootstrap();

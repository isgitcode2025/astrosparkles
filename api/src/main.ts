import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/http-exception.filter';
import { ResponseInterceptor } from './common/response.interceptor';
import { buildOpenApi } from './swagger';

async function bootstrap() {
  // rawBody is needed to verify Razorpay webhook signatures
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const config = app.get(ConfigService);

  app.use(helmet());
  app.enableCors({ origin: [config.get<string>('webUrl') as string], credentials: true });
  app.setGlobalPrefix(config.get<string>('apiPrefix') as string);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  // Interactive API docs at /docs, raw OpenAPI JSON at /docs-json (importable into Postman)
  SwaggerModule.setup('docs', app, buildOpenApi(app, config.get<string>('brand.name') as string));

  const port = config.get<number>('port') as number;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}/${config.get('apiPrefix')} · docs at /docs`);
}
bootstrap();

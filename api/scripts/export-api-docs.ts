/**
 * Generates docs/openapi.json and docs/postman/<brand>.postman_collection.json
 * for the Flutter team. Run: npm run docs:export (MongoDB must be reachable).
 */
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../src/app.module';
import { buildOpenApi } from '../src/swagger';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Converter = require('openapi-to-postmanv2');

async function run() {
  const app = await NestFactory.create(AppModule, { logger: ['error'] });
  const config = app.get(ConfigService);
  app.setGlobalPrefix(config.get<string>('apiPrefix') as string);
  await app.init();

  const brand = config.get<string>('brand.name') as string;
  const doc = buildOpenApi(app, brand);
  const outDir = join(__dirname, '..', '..', 'docs');
  mkdirSync(join(outDir, 'postman'), { recursive: true });
  writeFileSync(join(outDir, 'openapi.json'), JSON.stringify(doc, null, 2));

  Converter.convert(
    { type: 'json', data: doc },
    { folderStrategy: 'Tags', requestParametersResolution: 'Example', includeAuthInfoInExample: true },
    (err: Error | null, result: { result: boolean; reason?: string; output: { data: unknown }[] }) => {
      if (err || !result.result) throw err ?? new Error(result.reason);
      const file = join(outDir, 'postman', `${brand}.postman_collection.json`);
      writeFileSync(file, JSON.stringify(result.output[0].data, null, 2));
      console.log(`Wrote docs/openapi.json and ${file}`);
    },
  );
  await app.close();
}
run();

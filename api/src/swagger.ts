import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

export function buildOpenApi(app: INestApplication, brandName: string): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle(`${brandName} API`)
    .setDescription(
      'REST API shared by the website and the mobile apps. ' +
        'All responses are { success: true, data } or { success: false, error: { code, message } }.',
    )
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'user')
    .addServer('http://localhost:4000', 'Local')
    .build();
  return SwaggerModule.createDocument(app, config);
}

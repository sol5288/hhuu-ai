import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PORT, SWAGGERPREFIX, APIPREFIX } from '@/config/main';

const swaggerOptions = new DocumentBuilder()
  .setTitle('hhuu Team api document')
  .setDescription('hhuu Team api document')
  .setVersion('1.0.0')
  .addBearerAuth()
  .build();

export function createSwagger(app) {
  const document = SwaggerModule.createDocument(app, swaggerOptions);
  SwaggerModule.setup('/hhuu/docs', app, document);
}

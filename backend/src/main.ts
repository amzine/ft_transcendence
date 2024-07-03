import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {cors : true});
  app.enableCors({
    origin : "*",
  });
  const config = new DocumentBuilder()
    .setTitle('Trans api')
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, doc);  
  await app.listen(5000).then(() => {console.log('Server is Listening on port 5000')});
}

bootstrap();

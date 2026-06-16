import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cabeçalhos de segurança HTTP (C-02).
  // A API serve apenas JSON, não HTML, então o CSP padrão do Helmet é
  // desnecessário e poderia bloquear o Swagger UI quando habilitado fora de
  // produção. Desabilitamos só o CSP e mantemos os demais headers.
  app.use(helmet({ contentSecurityPolicy: false }));

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger — exposto apenas fora de produção (A-05).
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Relm Care+ API')
      .setDescription('API do Centro de Serviços ao Cliente Relm Bikes')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Autenticação')
      .addTag('public', 'Rotas públicas')
      .addTag('customers', 'Clientes')
      .addTag('products', 'Produtos')
      .addTag('warranty', 'Garantias')
      .addTag('benefits', 'Benefícios')
      .addTag('insurance', 'Seguro')
      .addTag('events', 'Eventos')
      .addTag('newsletter', 'Newsletter')
      .addTag('content', 'Conteúdo')
      .addTag('reports', 'Relatórios')
      .addTag('client', 'Portal do Cliente')
      .addTag('store', 'Portal Loja')
      .addTag('distributor', 'Portal Distribuidor')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Relm Care+ API rodando em http://0.0.0.0:${port}`);
  if (!isProduction) {
    console.log(`📚 Documentação Swagger: http://0.0.0.0:${port}/docs`);
  }
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();

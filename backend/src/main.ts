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

  // Trust proxy — a API roda atrás de 1 proxy reverso (nginx).
  // Sem isso, o @nestjs/throttler enxerga o IP do nginx e todos os clientes
  // compartilham o mesmo balde de rate limit. Confiar no primeiro proxy faz
  // o Express usar o IP real do cliente vindo do X-Forwarded-For.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS (C-01) — sem fallback inseguro para '*'.
  // CORS_ORIGIN pode ser uma lista separada por vírgula. Se não estiver
  // definido, a allowlist fica vazia (nenhuma origem cross-site é aceita)
  // em vez de liberar tudo com credenciais. Em produção, CORS_ORIGIN PRECISA
  // ser definido com o domínio real do frontend.
  const corsOrigins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);

  if (corsOrigins.length === 0) {
    console.warn(
      '⚠️ CORS_ORIGIN não definido — nenhuma origem cross-site será aceita. Defina CORS_ORIGIN em produção.',
    );
  }

  app.enableCors({
    origin: corsOrigins,
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

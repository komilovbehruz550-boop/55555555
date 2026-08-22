import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  if (!process.env.BOT_TOKEN) {
    // eslint-disable-next-line no-console
    console.error('XATO: .env faylida BOT_TOKEN topilmadi. README.md ga qarang.');
    process.exit(1);
  }
  const app = await NestFactory.createApplicationContext(AppModule);
  // eslint-disable-next-line no-console
  console.log('UNO bot ishga tushdi ✅');
  await app.init();
}

bootstrap();

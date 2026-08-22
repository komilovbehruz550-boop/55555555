"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    if (!process.env.BOT_TOKEN) {
        console.error('XATO: .env faylida BOT_TOKEN topilmadi. README.md ga qarang.');
        process.exit(1);
    }
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    console.log('UNO bot ishga tushdi ✅');
    await app.init();
}
bootstrap();
//# sourceMappingURL=main.js.map
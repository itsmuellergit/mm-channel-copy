import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express'; // Import hinzufügen
import * as session from 'express-session';
import * as hbs from 'hbs';
import { join } from 'path';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule); // Typ angeben

    // Session-Middleware einbinden
    app.use(
        session({
            secret: 'irgendeinkey', // Verwende hier einen sicheren Schlüssel
            resave: false,
            saveUninitialized: false,
            cookie: { maxAge: 3600000 }, // Cookie-Lebensdauer in Millisekunden (hier 1 Stunde)
        }),
    );

    // Statische Assets
    app.useStaticAssets(join(__dirname, '..', 'public'));

    // Views-Verzeichnis
    app.setBaseViewsDir(join(__dirname, '..', 'views'));

    // View-Engine auf Handlebars setzen
    app.setViewEngine('hbs');

    // Hilfsfunktionen für Handlebars registrieren (falls erforderlich)
    hbs.registerHelper('json', function (context) {
        return JSON.stringify(context);
    });

    await app.listen(3000);
}
bootstrap();

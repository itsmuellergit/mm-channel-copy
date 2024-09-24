import {
    Controller,
    Get,
    Post,
    Render,
    Body,
    Redirect,
    Query,
    Res,
    Session,
} from '@nestjs/common';
import { execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid'; // UUID-Paket importieren

@Controller('auth')
export class AuthController {
    @Get('login')
    @Render('login')
    getLogin(@Query('error') error: string) {
        return { error };
    }

    @Post('login')
    async postLogin(
        @Body() body,
        @Res() res,
        @Session() session: Record<string, any>,
    ) {
        const { serverName, username, password } = body;

        try {
            // Einzigartigen Kontextnamen für mmctl generieren
            const contextName = 'mmctl-' + uuidv4();

            // Mattermost Login via OS Call
            const command = `mmctl auth login ${serverName} --username ${username} --password ${password}  --name mattermost2`;

            execSync(command);

            // Login erfolgreich
            session.user = username;
            session.serverName = serverName;
            session.contextName = contextName; // Kontextname in Session speichern

            return res.redirect('/teams');
        } catch (error) {
            // Fehler beim Login
            return res.render('login', {
                error: true,
                serverName,
                username,
            });
        }
    }
}

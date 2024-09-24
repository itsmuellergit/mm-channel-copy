import {Controller, Get, Post, Render, Body, Session, Res} from '@nestjs/common';
import { execSync } from 'child_process';

@Controller()
export class AppController {
    @Get('teams')
    @Render('teams')
    getTeams(@Session() session: Record<string, any>, @Res() res) {
        if (!session.user) {
            return res.redirect('/auth/login');
        }

        try {
            const { contextName } = session;
            // Teams abrufen
            const teamsJson = execSync(`mmctl  team list --json`).toString();
            const teams = JSON.parse(teamsJson);

            return { teams };
        } catch (error) {
            return { error: 'Fehler beim Abrufen der Teams.' };
        }
    }


    @Post('channels')
    @Render('channels')
    postTeams(
        @Body() body,
        @Session() session: Record<string, any>,
        @Res() res,
    ) {
        if (!session.user) {
            return res.redirect('/auth/login');
        }

        const { sourceTeamName, targetTeamName } = body;
        const { configPath } = session;

        if (!sourceTeamName || !targetTeamName) {
            return res.render('teams', {
                error: 'Bitte wählen Sie sowohl ein Quell-Team als auch ein Ziel-Team aus.',
                teams: session.teams, // Teams erneut an die View übergeben
            });
        }

        try {
            const env = { ...process.env, MMCTL_CONFIG: configPath };

            // Kanäle vom Quell-Team abrufen
            const channelsJson = execSync(
                `mmctl channel list ${sourceTeamName} --json`,
                { env },
            ).toString();
            const channels = JSON.parse(channelsJson);

            // Ziel-Team in der Session speichern
            session.targetTeamName = targetTeamName;

            return { sourceTeamName, targetTeamName, channels };
        } catch (error) {
            return { error: 'Fehler beim Abrufen der Kanäle.' };
        }
    }

    @Post('generate')
    @Render('generate')
    generateBatch(
        @Body() body,
        @Session() session: Record<string, any>,
        @Res() res,
    ) {
        if (!session.user) {
            return res.redirect('/auth/login');
        }

        const { targetTeamName, channels } = body;
        const { configPath } = session;

        if (!channels) {
            return res.render('channels', {
                error: 'Bitte wählen Sie mindestens einen Kanal aus.',
                sourceTeamName: body.sourceTeamName,
                targetTeamName,
                channels: [], // Hier könntest du die Kanäle erneut übergeben
            });
        }

        // Sicherstellen, dass channels ein Array ist
        const selectedChannels = Array.isArray(channels) ? channels : [channels];

        let batchContent = '';

        selectedChannels.forEach(channelData => {
            // Kanalattribute extrahieren
            const channel = JSON.parse(channelData);
            const { name, display_name } = channel;

            // Batch-Zeile erstellen (Verwendung des Ziel-Teams)
            const line = `mmctl channel create --team ${targetTeamName} --name ${name} --display-name "${display_name}"\n`;
            batchContent += line;
        });

        // Batch-Datei speichern (optional)
        const fs = require('fs');
        fs.writeFileSync('create_channels.bat', batchContent);

        // Batch-Inhalt in der Session speichern
        session.batchContent = batchContent;

        return { message: 'Batch-Datei wurde erstellt.', batchContent };
    }

    @Post('execute')
    @Render('execute')
    executeCommands(
        @Session() session: Record<string, any>,
        @Res() res,
    ) {
        if (!session.user) {
            return res.redirect('/auth/login');
        }

        const { batchContent, configPath } = session;

        if (!batchContent) {
            return res.redirect('/generate');
        }

        const commands = batchContent.split('\n').filter(cmd => cmd.trim() !== '');
        const results = [];

        const env = { ...process.env, MMCTL_CONFIG: configPath };

        commands.forEach(command => {
            try {
                // Befehl ausführen
                const output = execSync(command, { env }).toString();
                results.push({ command, output });
            } catch (error) {
                results.push({ command, output: error.message });
            }
        });

        return { results };
    }
}

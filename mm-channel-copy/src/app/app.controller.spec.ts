import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import * as session from 'express-session';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';

describe('AppController', () => {
  let app: INestApplication;
  let sessionCookie: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    app = moduleRef.createNestApplication();

    // Session-Middleware einbinden
    app.use(
        session({
          secret: 'test-secret',
          resave: false,
          saveUninitialized: false,
        }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // Hilfsfunktion zum Setzen der Session
  const loginAndGetSession = async () => {
    // Mock für execSync
    jest.spyOn(require('child_process'), 'execSync').mockImplementation(() => '');

    const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          serverName: 'https://itsmueller3.spdns.org',
          username: 'testuser',
          password: 'testpassword',
        });
    sessionCookie = res.headers['set-cookie'];
  };

  beforeEach(async () => {
    await loginAndGetSession();
  });

  it('GET /teams sollte die Teams-Seite rendern', () => {
    // Mock für execSync
    const teamsJson = JSON.stringify([
      { name: 'team1', display_name: 'Team 1' },
      { name: 'team2', display_name: 'Team 2' },
    ]);
    jest.spyOn(require('child_process'), 'execSync').mockReturnValue(Buffer.from(teamsJson));

    return request(app.getHttpServer())
        .get('/teams')
        .set('Cookie', sessionCookie)
        .expect(200)
        .expect((res) => {
          expect(res.text).toContain('Teams auswählen');
          expect(res.text).toContain('Team 1');
          expect(res.text).toContain('Team 2');
        });
  });

  it('POST /channels sollte die Kanäle-Seite rendern', () => {
    // Mock für execSync
    const channelsJson = JSON.stringify([
      { name: 'channel1', display_name: 'Channel 1' },
      { name: 'channel2', display_name: 'Channel 2' },
    ]);
    jest.spyOn(require('child_process'), 'execSync').mockReturnValue(Buffer.from(channelsJson));

    return request(app.getHttpServer())
        .post('/channels')
        .set('Cookie', sessionCookie)
        .send({
          sourceTeamName: 'team1',
          targetTeamName: 'team2',
        })
        .expect(200)
        .expect((res) => {
          expect(res.text).toContain('Kanäle aus Quell-Team "team1" auswählen');
          expect(res.text).toContain('Channel 1');
          expect(res.text).toContain('Channel 2');
        });
  });

  it('POST /generate sollte die Batch-Datei erstellen', () => {
    // Setze die Session-Daten
    const sessionData = {
      user: 'testuser',
      configPath: '/tmp/test-config.json',
    };
    app.use((req, res, next) => {
      req.session = { ...sessionData };
      next();
    });

    return request(app.getHttpServer())
        .post('/generate')
        .send({
          targetTeamName: 'team2',
          channels: JSON.stringify({ name: 'channel1', display_name: 'Channel 1' }),
        })
        .expect(200)
        .expect((res) => {
          expect(res.text).toContain('Batch-Datei wurde erstellt');
          expect(res.text).toContain('mmctl channel create');
        });
  });

  it('POST /execute sollte die Befehle ausführen und Ergebnisse anzeigen', () => {
    // Mock für execSync
    jest.spyOn(require('child_process'), 'execSync').mockImplementation(() => 'Command executed');

    // Setze die Session-Daten
    const sessionData = {
      user: 'testuser',
      configPath: '/tmp/test-config.json',
      batchContent: 'mmctl channel create --team team2 --name channel1 --display-name "Channel 1"\n',
    };
    app.use((req, res, next) => {
      req.session = { ...sessionData };
      next();
    });

    return request(app.getHttpServer())
        .post('/execute')
        .expect(200)
        .expect((res) => {
          expect(res.text).toContain('Befehle wurden ausgeführt');
          expect(res.text).toContain('mmctl channel create');
          expect(res.text).toContain('Command executed');
        });
  });
});

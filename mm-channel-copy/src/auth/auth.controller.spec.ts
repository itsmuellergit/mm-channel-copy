import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import * as session from 'express-session';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';

describe('AuthController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
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

  it('GET /auth/login sollte die Login-Seite rendern', () => {
    return request(app.getHttpServer())
        .get('/auth/login')
        .expect(200)
        .expect((res) => {
          expect(res.text).toContain('Mattermost Login');
        });
  });

  it('POST /auth/login mit gültigen Daten sollte auf /teams umleiten', () => {
    // Mock für execSync
    jest.spyOn(require('child_process'), 'execSync').mockImplementation(() => '');

    return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          serverName: 'https://itsmueller3.spdns.org',
          username: 'testuser',
          password: 'testpassword',
        })
        .expect(302)
        .expect('Location', '/teams');
  });

  it('POST /auth/login mit ungültigen Daten sollte Fehler anzeigen', () => {
    // Mock für execSync, um einen Fehler zu werfen
    jest.spyOn(require('child_process'), 'execSync').mockImplementation(() => {
      throw new Error('Login failed');
    });

    return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          serverName: 'https://itsmueller3.spdns.org',
          username: 'invaliduser',
          password: 'invalidpassword',
        })
        .expect(200)
        .expect((res) => {
          expect(res.text).toContain('Login fehlgeschlagen');
        });
  });
});

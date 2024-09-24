"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const app_controller_1 = require("./app.controller");
const session = __importStar(require("express-session"));
const request = __importStar(require("supertest"));
describe('AppController', () => {
    let app;
    let sessionCookie;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        const moduleRef = yield testing_1.Test.createTestingModule({
            controllers: [app_controller_1.AppController],
        }).compile();
        app = moduleRef.createNestApplication();
        // Session-Middleware einbinden
        app.use(session({
            secret: 'test-secret',
            resave: false,
            saveUninitialized: false,
        }));
        yield app.init();
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield app.close();
    }));
    // Hilfsfunktion zum Setzen der Session
    const loginAndGetSession = () => __awaiter(void 0, void 0, void 0, function* () {
        // Mock für execSync
        jest.spyOn(require('child_process'), 'execSync').mockImplementation(() => '');
        const res = yield request(app.getHttpServer())
            .post('/auth/login')
            .send({
            serverName: 'https://itsmueller3.spdns.org',
            username: 'testuser',
            password: 'testpassword',
        });
        sessionCookie = res.headers['set-cookie'];
    });
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield loginAndGetSession();
    }));
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
            req.session = Object.assign({}, sessionData);
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
            req.session = Object.assign({}, sessionData);
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

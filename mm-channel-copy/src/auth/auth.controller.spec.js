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
const auth_controller_1 = require("./auth.controller");
const session = __importStar(require("express-session"));
const request = __importStar(require("supertest"));
describe('AuthController', () => {
    let app;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        const moduleRef = yield testing_1.Test.createTestingModule({
            controllers: [auth_controller_1.AuthController],
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

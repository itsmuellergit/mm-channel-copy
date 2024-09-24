"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const child_process_1 = require("child_process");
let AppController = (() => {
    let _classDecorators = [(0, common_1.Controller)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _instanceExtraInitializers = [];
    let _getTeams_decorators;
    let _postTeams_decorators;
    let _generateBatch_decorators;
    let _executeCommands_decorators;
    var AppController = _classThis = class {
        getTeams(session, res) {
            if (!session.user) {
                return res.redirect('/auth/login');
            }
            try {
                const { contextName } = session;
                // Teams abrufen
                const teamsJson = (0, child_process_1.execSync)(`mmctl  team list --json`).toString();
                const teams = JSON.parse(teamsJson);
                return { teams };
            }
            catch (error) {
                return { error: 'Fehler beim Abrufen der Teams.' };
            }
        }
        postTeams(body, session, res) {
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
                const env = Object.assign(Object.assign({}, process.env), { MMCTL_CONFIG: configPath });
                // Kanäle vom Quell-Team abrufen
                const channelsJson = (0, child_process_1.execSync)(`mmctl channel list ${sourceTeamName} --json`, { env }).toString();
                const channels = JSON.parse(channelsJson);
                // Ziel-Team in der Session speichern
                session.targetTeamName = targetTeamName;
                return { sourceTeamName, targetTeamName, channels };
            }
            catch (error) {
                return { error: 'Fehler beim Abrufen der Kanäle.' };
            }
        }
        generateBatch(body, session, res) {
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
        executeCommands(session, res) {
            if (!session.user) {
                return res.redirect('/auth/login');
            }
            const { batchContent, configPath } = session;
            if (!batchContent) {
                return res.redirect('/generate');
            }
            const commands = batchContent.split('\n').filter(cmd => cmd.trim() !== '');
            const results = [];
            const env = Object.assign(Object.assign({}, process.env), { MMCTL_CONFIG: configPath });
            commands.forEach(command => {
                try {
                    // Befehl ausführen
                    const output = (0, child_process_1.execSync)(command, { env }).toString();
                    results.push({ command, output });
                }
                catch (error) {
                    results.push({ command, output: error.message });
                }
            });
            return { results };
        }
        constructor() {
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    __setFunctionName(_classThis, "AppController");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getTeams_decorators = [(0, common_1.Get)('teams'), (0, common_1.Render)('teams')];
        _postTeams_decorators = [(0, common_1.Post)('channels'), (0, common_1.Render)('channels')];
        _generateBatch_decorators = [(0, common_1.Post)('generate'), (0, common_1.Render)('generate')];
        _executeCommands_decorators = [(0, common_1.Post)('execute'), (0, common_1.Render)('execute')];
        __esDecorate(_classThis, null, _getTeams_decorators, { kind: "method", name: "getTeams", static: false, private: false, access: { has: obj => "getTeams" in obj, get: obj => obj.getTeams }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _postTeams_decorators, { kind: "method", name: "postTeams", static: false, private: false, access: { has: obj => "postTeams" in obj, get: obj => obj.postTeams }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _generateBatch_decorators, { kind: "method", name: "generateBatch", static: false, private: false, access: { has: obj => "generateBatch" in obj, get: obj => obj.generateBatch }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _executeCommands_decorators, { kind: "method", name: "executeCommands", static: false, private: false, access: { has: obj => "executeCommands" in obj, get: obj => obj.executeCommands }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AppController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AppController = _classThis;
})();
exports.AppController = AppController;

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
var supabase_js_1 = require("@supabase/supabase-js");
var supabaseAdmin = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
function ensureProducerUser(email, password, fullName, description) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, users, listError, userId, existingUser, _b, newUser, userError, profile, profileError, producer, producerError;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, supabaseAdmin.auth.admin.listUsers()];
                case 1:
                    _a = _c.sent(), users = _a.data, listError = _a.error;
                    if (listError)
                        throw listError;
                    userId = null;
                    existingUser = users === null || users === void 0 ? void 0 : users.users.find(function (u) { return u.email === email; });
                    if (!existingUser) return [3 /*break*/, 2];
                    userId = existingUser.id;
                    console.log("\u2139\uFE0F Usuario ya existe: ".concat(email));
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, supabaseAdmin.auth.admin.createUser({
                        email: email,
                        password: password,
                        email_confirm: true,
                    })];
                case 3:
                    _b = _c.sent(), newUser = _b.data, userError = _b.error;
                    if (userError)
                        throw userError;
                    userId = newUser.user.id;
                    console.log("\u2705 Usuario creado: ".concat(email));
                    _c.label = 4;
                case 4: return [4 /*yield*/, supabaseAdmin
                        .from("profiles")
                        .select("id")
                        .eq("id", userId)
                        .single()];
                case 5:
                    profile = (_c.sent()).data;
                    if (!!profile) return [3 /*break*/, 7];
                    return [4 /*yield*/, supabaseAdmin
                            .from("profiles")
                            .insert({ id: userId, full_name: fullName })];
                case 6:
                    profileError = (_c.sent()).error;
                    if (profileError)
                        throw profileError;
                    console.log("\u2705 Perfil creado: ".concat(fullName));
                    return [3 /*break*/, 8];
                case 7:
                    console.log("\u2139\uFE0F Perfil ya existe: ".concat(fullName));
                    _c.label = 8;
                case 8: return [4 /*yield*/, supabaseAdmin
                        .from("producers")
                        .select("id")
                        .eq("id", userId)
                        .single()];
                case 9:
                    producer = (_c.sent()).data;
                    if (!!producer) return [3 /*break*/, 11];
                    return [4 /*yield*/, supabaseAdmin
                            .from("producers")
                            .insert({
                            id: userId,
                            business_name: fullName,
                            description: description,
                            address: "Dirección genérica",
                        })];
                case 10:
                    producerError = (_c.sent()).error;
                    if (producerError)
                        throw producerError;
                    console.log("\u2705 Productor creado: ".concat(fullName));
                    return [3 /*break*/, 12];
                case 11:
                    console.log("\u2139\uFE0F Productor ya existe: ".concat(fullName));
                    _c.label = 12;
                case 12: return [2 /*return*/];
            }
        });
    });
}
// Ejemplo: crear tres productores idempotentes
(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, ensureProducerUser("maria@example.com", "seguro123", "María López", "Cocinera desde hace 20 años en Lima.")];
            case 1:
                _a.sent();
                return [4 /*yield*/, ensureProducerUser("carlos@example.com", "seguro123", "Carlos Mendoza", "Pescador y cocinero desde niño.")];
            case 2:
                _a.sent();
                return [4 /*yield*/, ensureProducerUser("ana@example.com", "seguro123", "Ana Torres", "Nutricionista y amante de la comida saludable.")];
            case 3:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); })();

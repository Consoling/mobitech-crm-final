"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_js_1 = require("./env.js");
const crypto_1 = __importDefault(require("crypto"));
const generateAccessToken = (payload) => {
    const accessToken = jsonwebtoken_1.default.sign(payload, env_js_1.SYS_ENV.ACCESS_TOKEN_SECRET, {
        expiresIn: "15m"
    });
    return accessToken;
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (payload) => {
    const refreshToken = jsonwebtoken_1.default.sign(payload, env_js_1.SYS_ENV.REFRESH_TOKEN_SECRET, {
        expiresIn: "30d"
    });
    return refreshToken;
};
exports.generateRefreshToken = generateRefreshToken;
const hashToken = (token) => {
    return crypto_1.default.createHash("sha256").update(token).digest("hex");
};
exports.hashToken = hashToken;

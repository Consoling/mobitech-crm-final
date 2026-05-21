"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("dotenv/config");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const constants_1 = require("../../../utils/constants");
const router = express_1.default.Router();
router.get("/verify-app-token", async (req, res) => {
    const authHeaderRaw = req.headers["authorization"] || req.headers["Authorization"];
    const authHeader = Array.isArray(authHeaderRaw) ? authHeaderRaw[0] : authHeaderRaw;
    const token = typeof authHeader === "string" ? authHeader.replace(/^Bearer\s+/i, "") : null;
    if (!token) {
        return res.status(400).json({ error: "Token is required" });
    }
    const jwtSecret = process.env.JWT_SECRET ||
        "your-super-secret-jwt-key-here-make-it-long-and-random";
    if (!jwtSecret) {
        return res.status(500).json({ error: "JWT secret is not defined" });
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, jwtSecret);
        if (!payload || typeof payload !== "object" || !payload.userId) {
            return res.status(404).json({ error: "Token not found" });
        }
        if (typeof payload.exp !== "number" || typeof payload.iat !== "number") {
            return res.status(400).json({ error: "Invalid token payload" });
        }
        const tokenInfo = await (0, constants_1.getTokenInfo)(payload);
        if (tokenInfo?.isValid === false && tokenInfo?.isExpired === true) {
            return res.status(401).json({ error: "Token is expired" });
        }
        return res.json({ success: true });
    }
    catch (error) {
        console.error("Error verifying app token:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.default = router;

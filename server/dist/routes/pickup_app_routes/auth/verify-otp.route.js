"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("dotenv/config");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../../../config/prisma");
const router = express_1.default.Router();
router.post("/verify-app-otp", async (req, res) => {
    try {
        const authHeaderRaw = req.headers["authorization"] || req.headers["Authorization"];
        const authHeader = Array.isArray(authHeaderRaw) ? authHeaderRaw[0] : authHeaderRaw;
        const token = typeof authHeader === "string" ? authHeader.replace(/^Bearer\s+/i, "") : null;
        if (!token) {
            return res.status(401).json({ error: "Token is required" });
        }
        const jwtSecret = process.env.JWT_SECRET ||
            "your-super-secret-jwt-key-here-make-it-long-and-random";
        if (!jwtSecret) {
            console.error("JWT_SECRET is not defined in environment variables");
            return res.status(500).json({ error: "Server configuration error" });
        }
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(token, jwtSecret);
        }
        catch (err) {
            return res.status(401).json({ error: "Invalid token" });
        }
        if (!payload || typeof payload !== "object" || !payload.userId) {
            return res.status(401).json({ error: "Invalid token" });
        }
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ error: "Email and OTP are required" });
        }
        const user = await prisma_1.prisma.user.findFirst({
            where: { email: email },
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const otpfromdb = await prisma_1.prisma.otp.findFirst({
            where: {
                identifier: email,
                otp: otp,
                used: false,
                expiresAt: { gt: new Date() },
            },
        });
        if (!otpfromdb) {
            return res.status(401).json({ error: "Invalid or expired OTP" });
        }
        await prisma_1.prisma.otp.update({
            where: { id: otpfromdb.id },
            data: { used: true },
        });
        const finalToken = jsonwebtoken_1.default.sign({
            userId: user.id,
            email: user.email,
            role: user.role,
            phone: user.phone,
        }, jwtSecret, { expiresIn: "7d" });
        console.log("User:", user);
        return res.status(200).json({
            token: finalToken,
            user: { id: user.id, email: user.email, role: user.role, phone: user.phone },
        });
    }
    catch (error) {
        console.error("Error verifying OTP:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.default = router;

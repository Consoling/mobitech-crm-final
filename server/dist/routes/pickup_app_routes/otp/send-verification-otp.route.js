"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../../../config/prisma");
const env_1 = require("../../../utils/env");
const router = express_1.default.Router();
router.post("/send-otp-for-verification-pickup", async (req, res) => {
    try {
        const { identifier, message, channel } = req.body;
        console.log('Data received in send-verification-otp:', req.body);
        if (!identifier) {
            return res.status(400).json({ error: "Phone Number is required" });
        }
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }
        if (!channel || !["whatsapp", "sms"].includes(channel.toLowerCase())) {
            return res.status(400).json({ error: "Valid channel (whatsapp or sms) is required" });
        }
        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        // Store OTP in DB
        await prisma_1.prisma.otp.create({
            data: { identifier, otp, expiresAt },
        });
        const channelLower = channel.toLowerCase();
        if (channelLower === "whatsapp") {
            // Send WhatsApp OTP
            const whatsappUrl = `https://www.fast2sms.com/dev/whatsapp?authorization=${env_1.SYS_ENV.FAST2SMS_API_KEY}&message_id=4131&numbers=${identifier}&variables_values=${otp}`;
            try {
                const response = await fetch(whatsappUrl, { method: "GET" });
                if (response && response.ok) {
                    return res.json({
                        success: true,
                        message: "OTP sent on WhatsApp",
                        medium: "whatsapp",
                    });
                }
                else {
                    return res.status(500).json({ error: "Failed to send WhatsApp OTP" });
                }
            }
            catch (err) {
                console.error("WhatsApp OTP error:", err);
                return res.status(500).json({ error: "Failed to send WhatsApp OTP" });
            }
        }
        else if (channelLower === "sms") {
            // Send SMS OTP
            try {
                const response = await fetch(`${env_1.SYS_ENV.FAST2SMS_API_ENDPOINT}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        authorization: env_1.SYS_ENV.FAST2SMS_API_KEY || "",
                    },
                    body: JSON.stringify({
                        route: "q",
                        numbers: identifier,
                        language: "english",
                        message: `Dear Customer, ${otp} is the OTP for ${message}. Please DO NOT SHARE this with anyone. Team Mobitech`,
                    }),
                });
                if (response.ok) {
                    return res.json({
                        success: true,
                        message: "OTP sent via SMS",
                        medium: "sms",
                    });
                }
                else {
                    return res.status(500).json({ error: "Failed to send SMS OTP" });
                }
            }
            catch (err) {
                console.error("SMS OTP error:", err);
                return res.status(500).json({ error: "Failed to send SMS OTP" });
            }
        }
    }
    catch (error) {
        console.error("Error sending OTP:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.default = router;

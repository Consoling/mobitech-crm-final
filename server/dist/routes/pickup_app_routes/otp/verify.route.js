"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("dotenv/config");
const prisma_1 = require("../../../config/prisma");
const router = express_1.default.Router();
router.post("/verify-otp-for-pickup", async (req, res) => {
    try {
        const { identifier, otp } = req.body;
        if (!identifier || !otp) {
            return res.status(400).json({ error: "Identifier and OTP are required" });
        }
        // Check if OTP is valid
        const validOtp = await prisma_1.prisma.otp.findFirst({
            where: {
                identifier,
                otp,
                used: false,
                expiresAt: {
                    gt: new Date(),
                },
            },
        });
        if (!validOtp) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }
        await prisma_1.prisma.otp.update({
            where: { id: validOtp.id },
            data: { used: true },
        });
        // OTP is valid, proceed with the verification
        return res.json({ success: true, message: "OTP verified successfully" });
    }
    catch (error) {
        console.error("Error verifying OTP:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.default = router;

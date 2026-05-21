"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("./../../../utils/env");
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.post("/verify-otp", async (req, res) => {
    try {
        const { request_id, otp } = req.body;
        if (!request_id || !otp) {
            return res.status(400).json({ error: "Request ID and OTP are required" });
        }
        const response = await fetch("https://api.quickekyc.com/api/v1/aadhaar-v2/submit-otp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                key: env_1.SYS_ENV.QUICKEKYC_KEY,
                request_id,
                otp,
            }),
        });
        const data = await response.json();
        console.log("OTP Verification Response:", data);
        return res.status(response.status).json(data);
    }
    catch (error) {
        console.error("Error verifying OTP:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.default = router;

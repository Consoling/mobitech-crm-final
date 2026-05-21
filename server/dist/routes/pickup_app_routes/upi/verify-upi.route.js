"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("dotenv/config");
const env_1 = require("../../../utils/env");
const router = express_1.default.Router();
router.post("/verify-upi", async (req, res) => {
    try {
        const { upi_id } = req.body;
        if (!upi_id)
            return res.status(400).json({ message: "Missing required fields" });
        const response = await fetch("https://api.quickekyc.com/api/v1/bank-verification/upi-verification", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                key: env_1.SYS_ENV.QUICKEKYC_KEY,
                upi_id,
            }),
        });
        const data = await response.json();
        if (data.status_code !== 200) {
            return res.status(data.status_code).json({
                message: data.message || "Failed to verify UPI ID",
                res_code: data.status_code || "ERROR",
            });
        }
        else {
            console.log(data);
            res.status(200).json({
                message: "UPI ID verified successfully",
                res_code: data.status_code || "SUCCESS",
                data: data.data,
            });
        }
    }
    catch (error) {
        console.error("Error verifying UPI ID:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.default = router;

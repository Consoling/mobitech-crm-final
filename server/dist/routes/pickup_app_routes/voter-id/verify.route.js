"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("./../../../utils/env");
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.post("/verify", async (req, res) => {
    try {
        const { id_number } = req.body;
        if (!id_number) {
            return res.status(400).json({ error: "ID number is required" });
        }
        const response = await fetch("https://api.quickekyc.com/api/v1/voter-id/voter-id", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                key: env_1.SYS_ENV.QUICKEKYC_KEY,
                id_number,
            }),
        });
        const data = await response.json();
        if (data.status_code !== 200) {
            return res.status(400).json({ status: 400, message: data.message });
        }
        return res
            .status(200)
            .json({ status: 200, message: data.message, data: data.data });
    }
    catch (error) {
        console.error("Error verifying Voter ID:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.default = router;

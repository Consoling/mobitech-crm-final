"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("dotenv/config");
const prisma_1 = require("../../config/prisma");
const router = express_1.default.Router();
router.post("/get-qc-report-init-data", async (req, res) => {
    try {
        const { testId } = req.body;
        if (!testId) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const test = await prisma_1.prisma.diagnosticsData.findUnique({
            where: { testId },
        });
        // console.log("Fetched report for testId:", testId, "Report:", report);
        if (!test) {
            return res.status(404).json({ error: "Test not found" });
        }
        console.log("Fetched test for testId:", testId, "Test:", test);
        const createdAtIST = new Date(test.createdAt).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            dateStyle: "medium",
            timeStyle: "short",
        });
        const formatted = {
            testId: test.testId,
            imei1: test.imei1,
            imei2: test.imei2,
            connectivityTestResults: test.wifiTest,
            deviceTestResults: test.deviceInfo,
            screenTest: test.screenTest,
            simTestResults: test.isSimCarWorking,
            audioTest: test.audioJackTest,
            proximitySensorTest: test.proximityTest,
            cameraTest: test.cameraTest,
            fingerprintTest: test.fingerprintTest,
            usbTest: test.usbPortTest,
            audioJackTest: test.audioJackTest,
            createdAt: createdAtIST,
        };
        return res.json({ success: true, report: test, formatted: formatted });
    }
    catch (error) {
        console.error("Error fetching QC Report:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.default = router;

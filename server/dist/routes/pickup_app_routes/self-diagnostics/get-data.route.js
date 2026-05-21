"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../../../config/prisma");
const router = express_1.default.Router();
router.post('/get-manual-diagnostics', async (req, res) => {
    try {
        const { reportId } = req.body;
        if (!reportId) {
            return res.status(400).json({ error: "reportId is required" });
        }
        const report = await prisma_1.prisma.manualDiagnosticsResult.findUnique({
            where: {
                diagnoseId: reportId
            }
        });
        if (!report) {
            return res.status(404).json({ error: "Report not found" });
        }
        console.log("report:", report);
        const formattedReport = {
            reportId: report.id,
            diagnoseId: report.diagnoseId,
            variant: report.variant,
            imei1: report.imei1,
            imei2: report.imei2,
        };
        return res.status(200).json(formattedReport);
    }
    catch (error) {
        console.error("Error fetching diagnostics report:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.default = router;

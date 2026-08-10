"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const diagnostics_service_1 = require("../../../services/diagnostics.service");
const diagnostics_validator_1 = require("../../../utils/diagnostics.validator");
const constants_1 = require("../../../utils/constants");
const router = express_1.default.Router();
/**
 * Handler helper for GET diagnostics data
 */
async function handleGetDiagnostics(req, res) {
    try {
        const testId = req.params.testId || req.body.testId || req.query.testId;
        const mtype = req.query.mtype || req.body.mtype;
        if (!testId || typeof testId !== "string" || testId.trim() === "") {
            return res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: "testId is required and must be a non-empty string",
            });
        }
        const formattedData = await diagnostics_service_1.DiagnosticsService.getFormattedDiagnosticsByTestId(testId.trim(), mtype);
        if (!formattedData) {
            return res.status(constants_1.HTTP_STATUS.NOT_FOUND).json({
                success: false,
                error: `Diagnostic test result not found for testId: ${testId}`,
            });
        }
        return res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            message: "Diagnostics data retrieved successfully",
            data: formattedData,
        });
    }
    catch (error) {
        console.error("[Get Diagnostics Data Error]:", error);
        return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to retrieve diagnostics data",
            error: error.message || constants_1.ERROR_MESSAGES.UNEXPECTED_ERROR,
        });
    }
}
/**
 * Handler helper for UPDATE diagnostics data
 */
async function handleUpdateDiagnostics(req, res) {
    try {
        const testId = req.params.testId || req.body.testId || req.query.testId;
        if (!testId || typeof testId !== "string" || testId.trim() === "") {
            return res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: "testId is required and must be a non-empty string",
            });
        }
        const updates = req.body;
        if (!updates || typeof updates !== "object") {
            return res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: "Update payload must be a valid JSON object",
            });
        }
        const updatedData = await diagnostics_service_1.DiagnosticsService.updateDiagnosticsDataByTestId(testId.trim(), updates);
        return res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            message: "Diagnostics data updated successfully",
            data: updatedData,
        });
    }
    catch (error) {
        if (error instanceof diagnostics_validator_1.ValidationError || error.message?.includes("not found")) {
            return res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: error.message,
            });
        }
        console.error("[Update Diagnostics Data Error]:", error);
        return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to update diagnostics data",
            error: error.message || constants_1.ERROR_MESSAGES.UNEXPECTED_ERROR,
        });
    }
}
// GET Routes
router.get("/get-diagnostics-data/:testId", handleGetDiagnostics);
router.get("/get-diagnostics-data", handleGetDiagnostics);
router.post("/get-diagnostics-data", handleGetDiagnostics);
// UPDATE Routes
router.put("/update-diagnostics-data/:testId", handleUpdateDiagnostics);
router.patch("/update-diagnostics-data/:testId", handleUpdateDiagnostics);
router.post("/update-diagnostics-data", handleUpdateDiagnostics);
router.put("/update-diagnostics-data", handleUpdateDiagnostics);
exports.default = router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const diagnostics_service_1 = require("../../services/diagnostics.service");
const diagnostics_validator_1 = require("../../utils/diagnostics.validator");
const constants_1 = require("../../utils/constants");
const router = express_1.default.Router();
/**
 * POST /api/diagnose/upload-diag-data
 * Upload diagnostics data from device testing
 *
 * @route POST /upload-diagnostics-data
 * @access Public (should be protected in production)
 * @returns {DiagnosticsDataResponse} Response with created diagnostics data
 */
router.post("/upload-diagnostics-data", async (req, res) => {
    const startTime = Date.now();
    try {
        // Extract request body
        const requestData = req.body;
        // Log incoming request (sanitize sensitive data in production)
        console.log(`[Diagnostics Upload] TestID: ${requestData.testId}, Employee: ${requestData.employeeId}`);
        // Validate and create diagnostics data using service layer
        const diagnosticsData = await diagnostics_service_1.DiagnosticsService.createDiagnosticsData(requestData);
        // Log success
        const duration = Date.now() - startTime;
        console.log(`[Diagnostics Upload] Success - TestID: ${requestData.testId} (${duration}ms)`);
        // Return success response
        return res.status(constants_1.HTTP_STATUS.CREATED).json({
            success: true,
            message: constants_1.SUCCESS_MESSAGES.DIAGNOSTICS_UPLOADED,
            data: diagnosticsData,
        });
    }
    catch (error) {
        const duration = Date.now() - startTime;
        // Handle validation errors (400 Bad Request)
        if (error instanceof diagnostics_validator_1.ValidationError) {
            console.warn(`[Diagnostics Upload] Validation Error (${duration}ms):`, error.message);
            return res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: constants_1.ERROR_MESSAGES.VALIDATION_FAILED,
                error: error.message,
            });
        }
        // Handle duplicate entry errors (409 Conflict)
        if (error.message && error.message.includes("already exists")) {
            console.warn(`[Diagnostics Upload] Duplicate Entry (${duration}ms):`, error.message);
            return res.status(constants_1.HTTP_STATUS.CONFLICT).json({
                success: false,
                message: constants_1.ERROR_MESSAGES.DUPLICATE_ENTRY,
                error: error.message,
            });
        }
        // Handle database connection errors
        if (error.code === constants_1.PRISMA_ERROR_CODES.CONNECTION_ERROR || error.code === constants_1.PRISMA_ERROR_CODES.CONNECTION_TIMEOUT) {
            console.error(`[Diagnostics Upload] Database Connection Error (${duration}ms):`, error);
            return res.status(constants_1.HTTP_STATUS.SERVICE_UNAVAILABLE).json({
                success: false,
                message: constants_1.ERROR_MESSAGES.DATABASE_CONNECTION_FAILED,
                error: constants_1.ERROR_MESSAGES.SERVICE_UNAVAILABLE,
            });
        }
        // Handle generic database errors
        if (error.code && error.code.startsWith("P")) {
            console.error(`[Diagnostics Upload] Database Error ${error.code} (${duration}ms):`, error);
            return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: constants_1.ERROR_MESSAGES.DATABASE_OPERATION_FAILED,
                error: process.env.NODE_ENV === "production"
                    ? constants_1.ERROR_MESSAGES.GENERIC_ERROR
                    : error.message,
            });
        }
        // Handle unexpected errors (500 Internal Server Error)
        console.error(`[Diagnostics Upload] Unexpected Error (${duration}ms):`, error);
        return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to upload diagnostics data",
            error: process.env.NODE_ENV === "production"
                ? constants_1.ERROR_MESSAGES.UNEXPECTED_ERROR
                : error.message,
        });
    }
});
exports.default = router;

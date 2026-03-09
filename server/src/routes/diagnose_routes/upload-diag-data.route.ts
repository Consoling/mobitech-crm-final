import express, { Request, Response } from "express";
import { DiagnosticsService } from "../../services/diagnostics.service";
import { ValidationError } from "../../utils/diagnostics.validator";
import { DiagnosticsDataRequest, DiagnosticsDataResponse } from "../../types/diagnostics.types";
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES, PRISMA_ERROR_CODES } from "../../utils/constants";

const router = express.Router();

/**
 * POST /api/diagnose/upload-diag-data
 * Upload diagnostics data from device testing
 * 
 * @route POST /upload-diagnostics-data
 * @access Public (should be protected in production)
 * @returns {DiagnosticsDataResponse} Response with created diagnostics data
 */
router.post("/upload-diagnostics-data", async (req: Request, res: Response): Promise<Response<DiagnosticsDataResponse>> => {
  const startTime = Date.now();
  
  try {
    // Extract request body
    const requestData: DiagnosticsDataRequest = req.body;

    // Log incoming request (sanitize sensitive data in production)
    console.log(`[Diagnostics Upload] TestID: ${requestData.testId}, Employee: ${requestData.employeeId}`);

    // Validate and create diagnostics data using service layer
    const diagnosticsData = await DiagnosticsService.createDiagnosticsData(requestData);

    // Log success
    const duration = Date.now() - startTime;
    console.log(`[Diagnostics Upload] Success - TestID: ${requestData.testId} (${duration}ms)`);

    // Return success response
    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: SUCCESS_MESSAGES.DIAGNOSTICS_UPLOADED,
      data: diagnosticsData,
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // Handle validation errors (400 Bad Request)
    if (error instanceof ValidationError) {
      console.warn(`[Diagnostics Upload] Validation Error (${duration}ms):`, error.message);
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.VALIDATION_FAILED,
        error: error.message,
      });
    }

    // Handle duplicate entry errors (409 Conflict)
    if (error.message && error.message.includes("already exists")) {
      console.warn(`[Diagnostics Upload] Duplicate Entry (${duration}ms):`, error.message);
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: ERROR_MESSAGES.DUPLICATE_ENTRY,
        error: error.message,
      });
    }

    // Handle database connection errors
    if (error.code === PRISMA_ERROR_CODES.CONNECTION_ERROR || error.code === PRISMA_ERROR_CODES.CONNECTION_TIMEOUT) {
      console.error(`[Diagnostics Upload] Database Connection Error (${duration}ms):`, error);
      return res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
        success: false,
        message: ERROR_MESSAGES.DATABASE_CONNECTION_FAILED,
        error: ERROR_MESSAGES.SERVICE_UNAVAILABLE,
      });
    }

    // Handle generic database errors
    if (error.code && error.code.startsWith("P")) {
      console.error(`[Diagnostics Upload] Database Error ${error.code} (${duration}ms):`, error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.DATABASE_OPERATION_FAILED,
        error: process.env.NODE_ENV === "production" 
          ? ERROR_MESSAGES.GENERIC_ERROR
          : error.message,
      });
    }

    // Handle unexpected errors (500 Internal Server Error)
    console.error(`[Diagnostics Upload] Unexpected Error (${duration}ms):`, error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to upload diagnostics data",
      error: process.env.NODE_ENV === "production" 
        ? ERROR_MESSAGES.UNEXPECTED_ERROR
        : error.message,
    });
  }
});

export default router;
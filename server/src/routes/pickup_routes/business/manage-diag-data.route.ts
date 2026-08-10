import express, { Request, Response } from "express";
import { DiagnosticsService } from "../../../services/diagnostics.service";
import { ValidationError } from "../../../utils/diagnostics.validator";
import { HTTP_STATUS, ERROR_MESSAGES } from "../../../utils/constants";

const router = express.Router();

/**
 * Handler helper for GET diagnostics data
 */
async function handleGetDiagnostics(req: Request, res: Response) {
  try {
    const testId = req.params.testId || req.body.testId || (req.query.testId as string);
    const mtype = (req.query.mtype as string) || req.body.mtype;

    if (!testId || typeof testId !== "string" || testId.trim() === "") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: "testId is required and must be a non-empty string",
      });
    }

    const formattedData = await DiagnosticsService.getFormattedDiagnosticsByTestId(
      testId.trim(),
      mtype
    );

    if (!formattedData) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: `Diagnostic test result not found for testId: ${testId}`,
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Diagnostics data retrieved successfully",
      data: formattedData,
    });
  } catch (error: any) {
    console.error("[Get Diagnostics Data Error]:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to retrieve diagnostics data",
      error: error.message || ERROR_MESSAGES.UNEXPECTED_ERROR,
    });
  }
}

/**
 * Handler helper for UPDATE diagnostics data
 */
async function handleUpdateDiagnostics(req: Request, res: Response) {
  try {
    const testId = req.params.testId || req.body.testId || (req.query.testId as string);

    if (!testId || typeof testId !== "string" || testId.trim() === "") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: "testId is required and must be a non-empty string",
      });
    }

    const updates = req.body;
    if (!updates || typeof updates !== "object") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: "Update payload must be a valid JSON object",
      });
    }

    const updatedData = await DiagnosticsService.updateDiagnosticsDataByTestId(
      testId.trim(),
      updates
    );

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Diagnostics data updated successfully",
      data: updatedData,
    });
  } catch (error: any) {
    if (error instanceof ValidationError || error.message?.includes("not found")) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: error.message,
      });
    }

    console.error("[Update Diagnostics Data Error]:", error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to update diagnostics data",
      error: error.message || ERROR_MESSAGES.UNEXPECTED_ERROR,
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

export default router;

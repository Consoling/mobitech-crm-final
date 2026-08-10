import express, { Request, Response } from "express";
import { Types } from "mongoose";
import Device from "../models/Device";
import { z } from "zod";


const router = express.Router();
router.post("/get-device-details", async (req: Request, res: Response) => {
  try {
    const { modelCode } = req.body;

    if (!modelCode) {
      return res.status(400).json({ error: "Mode code is required" });
    }

    // Find device by modelCode in the modelCodes array
    const foundModel = await Device.findOne({
      modelCodes: modelCode
    }).lean();

    if (!foundModel) {
      return res.status(404).json({ error: "Device model not found" });
    }

    // console.log("Found model:", foundModel);

    return res.status(200).json({ result: "success", data: foundModel });
  } catch (error: any) {
    console.error("POST /api/check-custom-model error:", error);

    return res.status(500).json({ result: "error", message: error.message });
  }
});


router.get("/get-devices-wtmc", async (req: Request, res: Response) => {
  try {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const filter = {
      $or: [
        { modelCodes: { $size: 0 } },
        { modelCodes: { $exists: false } },
      ],
    };

    const total = await Device.countDocuments(filter);

    const devices = await Device.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return res.status(200).json({
      result: "success",
      data: devices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    });
  } catch (error: any) {
    console.error("GET /api/get-devices-wtmc error:", error);

    return res.status(500).json({
      result: "error",
      message: error.message,
    });
  }
});


router.put("/devices/update-model-codes", async (req: Request, res: Response) => {
  try {
    const { deviceId, modelCodes } = req.body;

    // Validation
    if (!deviceId) {
      return res.status(400).json({
        result: "error",
        message: "deviceId is required",
      });
    }

    if (!Types.ObjectId.isValid(deviceId)) {
      return res.status(400).json({
        result: "error",
        message: "Invalid deviceId format",
      });
    }

    if (!Array.isArray(modelCodes)) {
      return res.status(400).json({
        result: "error",
        message: "modelCodes must be an array",
      });
    }

    if (modelCodes.length === 0) {
      return res.status(400).json({
        result: "error",
        message: "modelCodes cannot be empty",
      });
    }

    // Remove duplicates and empty values
    const cleanedModelCodes = [
      ...new Set(
        modelCodes
          .map((code: string) => code.trim())
          .filter(Boolean)
      ),
    ];

    const device = await Device.findByIdAndUpdate(
      deviceId,
      {
        $addToSet: {
          modelCodes: {
            $each: cleanedModelCodes,
          },
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).lean();

    if (!device) {
      return res.status(404).json({
        result: "error",
        message: "Device not found",
      });
    }

    return res.status(200).json({
      result: "success",
      message: "Model codes updated successfully",
      data: device,
    });
  } catch (error: any) {
    console.error("PUT /devices/model-codes:", error);

    return res.status(500).json({
      result: "error",
      message: error.message,
    });
  }
})
export default router;

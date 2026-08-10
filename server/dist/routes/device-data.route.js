"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = require("mongoose");
const Device_1 = __importDefault(require("../models/Device"));
const router = express_1.default.Router();
router.post("/get-device-details", async (req, res) => {
    try {
        const { modelCode } = req.body;
        if (!modelCode) {
            return res.status(400).json({ error: "Mode code is required" });
        }
        // Find device by modelCode in the modelCodes array
        const foundModel = await Device_1.default.findOne({
            modelCodes: modelCode
        }).lean();
        if (!foundModel) {
            return res.status(404).json({ error: "Device model not found" });
        }
        // console.log("Found model:", foundModel);
        return res.status(200).json({ result: "success", data: foundModel });
    }
    catch (error) {
        console.error("POST /api/check-custom-model error:", error);
        return res.status(500).json({ result: "error", message: error.message });
    }
});
router.get("/get-devices-wtmc", async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const filter = {
            $or: [
                { modelCodes: { $size: 0 } },
                { modelCodes: { $exists: false } },
            ],
        };
        const total = await Device_1.default.countDocuments(filter);
        const devices = await Device_1.default.find(filter)
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
    }
    catch (error) {
        console.error("GET /api/get-devices-wtmc error:", error);
        return res.status(500).json({
            result: "error",
            message: error.message,
        });
    }
});
router.put("/devices/update-model-codes", async (req, res) => {
    try {
        const { deviceId, modelCodes } = req.body;
        // Validation
        if (!deviceId) {
            return res.status(400).json({
                result: "error",
                message: "deviceId is required",
            });
        }
        if (!mongoose_1.Types.ObjectId.isValid(deviceId)) {
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
            ...new Set(modelCodes
                .map((code) => code.trim())
                .filter(Boolean)),
        ];
        const device = await Device_1.default.findByIdAndUpdate(deviceId, {
            $addToSet: {
                modelCodes: {
                    $each: cleanedModelCodes,
                },
            },
        }, {
            new: true,
            runValidators: true,
        }).lean();
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
    }
    catch (error) {
        console.error("PUT /devices/model-codes:", error);
        return res.status(500).json({
            result: "error",
            message: error.message,
        });
    }
});
exports.default = router;

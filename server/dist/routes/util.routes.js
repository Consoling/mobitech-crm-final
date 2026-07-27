"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const DeviceVariant_1 = __importDefault(require("../models/DeviceVariant"));
const zod_1 = require("zod");
const router = express_1.default.Router();
router.get("/get-device-variants", async (_req, res) => {
    try {
        const variants = await DeviceVariant_1.default.find().lean();
        return res.status(200).json({
            status: "success",
            data: variants,
        });
    }
    catch (error) {
        console.error("GET /api/get-device-variants error:", error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
});
router.post("/add-device-variant", async (req, res) => {
    try {
        const variantSchema = zod_1.z.object({
            variant: zod_1.z.string().trim().min(1),
            isActive: zod_1.z.boolean().optional().default(true),
        });
        const data = await variantSchema.parseAsync(req.body);
        const exists = await DeviceVariant_1.default.findOne({
            variant: data.variant,
        });
        if (exists) {
            return res.status(409).json({
                status: "error",
                message: "Device variant already exists.",
            });
        }
        const newVariant = await DeviceVariant_1.default.create(data);
        return res.status(201).json({
            status: "success",
            data: newVariant,
        });
    }
    catch (error) {
        console.error("POST /api/add-device-variant error:", error);
        return res.status(400).json({
            status: "error",
            message: "Invalid request data.",
        });
    }
});
router.patch("/update-device-variant/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const updateSchema = zod_1.z.object({
            variant: zod_1.z.string().trim().min(1).optional(),
            isActive: zod_1.z.boolean().optional(),
        });
        const updateData = await updateSchema.parseAsync(req.body);
        if (updateData.variant) {
            const exists = await DeviceVariant_1.default.findOne({
                variant: updateData.variant,
                _id: { $ne: id },
            });
            if (exists) {
                return res.status(409).json({
                    status: "error",
                    message: "Device variant already exists.",
                });
            }
        }
        const updatedVariant = await DeviceVariant_1.default.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        }).lean();
        if (!updatedVariant) {
            return res.status(404).json({
                status: "error",
                message: "Device variant not found.",
            });
        }
        return res.status(200).json({
            status: "success",
            data: updatedVariant,
        });
    }
    catch (error) {
        console.error("PATCH /api/update-device-variant/:id error:", error);
        return res.status(400).json({
            status: "error",
            message: "Invalid request data.",
        });
    }
});
exports.default = router;

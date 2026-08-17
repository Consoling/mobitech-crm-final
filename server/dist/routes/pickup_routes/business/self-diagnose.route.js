"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUniqueOrderId = void 0;
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../../../config/prisma");
const pickupauth_middleware_1 = require("../../../middlewares/pickupauth.middleware");
const router = express_1.default.Router();
const generateUniqueOrderId = async () => {
    while (true) {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let randomPart = "";
        for (let i = 0; i < 7; i++) {
            randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const orderId = `${randomPart}`;
        const existing = await prisma_1.prisma.selfDiagnoseData.findUnique({
            where: {
                orderId,
            },
            select: {
                id: true,
            },
        });
        if (!existing) {
            return orderId;
        }
    }
};
exports.generateUniqueOrderId = generateUniqueOrderId;
router.post("/create", pickupauth_middleware_1.authenticate, async (req, res) => {
    try {
        const orderId = await (0, exports.generateUniqueOrderId)();
        const { deviceType, brand } = req.body;
        if (!deviceType || !brand) {
            return res.status(400).json({
                success: false,
                message: "Device type and brand are required.",
            });
        }
        const newSelfDiagnoseData = await prisma_1.prisma.selfDiagnoseData.create({
            data: {
                orderId,
                stage: "IN_PROGRESS",
                employeeId: req.user.userId,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                deviceType,
            },
        });
        res.status(201).json({
            success: true,
            message: "Self-diagnosis data created successfully.",
            data: newSelfDiagnoseData,
        });
    }
    catch (error) {
        console.error("Error creating self-diagnosis data:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while creating the self-diagnosis data.",
        });
    }
});
router.patch("/update/:orderId", pickupauth_middleware_1.authenticate, async (req, res) => {
    try {
        const { orderId } = req.params;
        const selfDiagnoseData = await prisma_1.prisma.selfDiagnoseData.findFirst({
            where: {
                orderId,
                employeeId: req.user.userId,
                stage: "IN_PROGRESS",
            },
        });
        if (!selfDiagnoseData) {
            return res.status(404).json({
                success: false,
                message: "Self-diagnosis data not found.",
            });
        }
        const updatedSelfDiagnoseData = await prisma_1.prisma.selfDiagnoseData.update({
            where: {
                id: selfDiagnoseData.id,
            },
            data: {
                ...req.body,
            },
        });
        return res.status(200).json({
            success: true,
            message: "Self-diagnosis data synced successfully.",
            data: updatedSelfDiagnoseData,
        });
    }
    catch (error) {
        console.error("Error updating self-diagnosis data:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while updating the self-diagnosis data.",
        });
    }
});
router.delete("/delete/:id", pickupauth_middleware_1.authenticate, async (req, res) => {
    try {
        const orderId = req.params.id;
        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "Order ID is required.",
            });
        }
        const deletedSelfDiagnoseData = await prisma_1.prisma.selfDiagnoseData.update({
            where: {
                orderId,
            },
            data: {
                stage: "CANCELLED",
            },
        });
        if (!deletedSelfDiagnoseData) {
            return res.status(404).json({
                success: false,
                message: "Self-diagnosis data not found.",
            });
        }
        res.status(200).json({
            success: true,
            message: "Self-diagnosis data deleted successfully.",
            // data: deletedSelfDiagnoseData,
        });
    }
    catch (error) {
        console.error("Error deleting self-diagnosis data:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while deleting the self-diagnosis data.",
        });
    }
});
exports.default = router;

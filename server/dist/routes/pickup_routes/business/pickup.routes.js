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
        const orderId = `MT-${randomPart}`;
        const existing = await prisma_1.prisma.doorstepPickup.findUnique({
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
        const { employeeDbId } = req.body;
        if (!employeeDbId || req.user.userId) {
            return res.status(400).json({
                success: false,
                message: "Employee ID is required.",
            });
        }
        const orderId = await (0, exports.generateUniqueOrderId)();
        const newPickup = await prisma_1.prisma.doorstepPickup.create({
            data: {
                orderId,
                stage: "IN_PROGRESS",
                employeeId: employeeDbId || req.user.userId,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
        });
        res.status(201).json({
            success: true,
            message: "Pickup created successfully.",
            data: newPickup,
        });
    }
    catch (error) {
        console.error("Error creating pickup:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while creating the pickup.",
        });
    }
});
exports.default = router;

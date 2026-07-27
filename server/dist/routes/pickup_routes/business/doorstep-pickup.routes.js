"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUniqueOrderId = void 0;
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../../../config/prisma");
const pickupauth_middleware_1 = require("../../../middlewares/pickupauth.middleware");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const crypto_1 = require("crypto");
const pre_signed_url_route_1 = require("../../pickup_app_routes/final-upload/pre-signed-url.route");
const env_1 = require("../../../utils/env");
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
        const orderId = await (0, exports.generateUniqueOrderId)();
        const newPickup = await prisma_1.prisma.doorstepPickup.create({
            data: {
                orderId,
                stage: "IN_PROGRESS",
                employeeId: req.user.userId,
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
router.delete("/delete/:id", pickupauth_middleware_1.authenticate, async (req, res) => {
    try {
        const orderId = req.params.id;
        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "Order ID is required.",
            });
        }
        const deletedPickup = await prisma_1.prisma.doorstepPickup.update({
            where: {
                orderId,
            },
            data: {
                stage: "CANCELLED",
            },
        });
        if (!deletedPickup) {
            return res.status(404).json({
                success: false,
                message: "Pickup not found.",
            });
        }
        res.status(200).json({
            success: true,
            message: "Pickup deleted successfully.",
            // data: deletedPickup,
        });
    }
    catch (error) {
        console.error("Error deleting pickup:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while deleting the pickup.",
        });
    }
});
router.patch("/update/:orderId", pickupauth_middleware_1.authenticate, async (req, res) => {
    try {
        const { orderId } = req.params;
        const pickup = await prisma_1.prisma.doorstepPickup.findFirst({
            where: {
                orderId,
                employeeId: req.user.userId,
                stage: "IN_PROGRESS",
            },
        });
        if (!pickup) {
            return res.status(404).json({
                success: false,
                message: "Pickup not found.",
            });
        }
        const updatedPickup = await prisma_1.prisma.doorstepPickup.update({
            where: {
                id: pickup.id,
            },
            data: {
                ...req.body,
            },
        });
        return res.status(200).json({
            success: true,
            message: "Pickup synced successfully.",
            data: updatedPickup,
        });
    }
    catch (error) {
        console.error("Error updating pickup:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while updating the pickup.",
        });
    }
});
router.post(`/get-presigned-url`, pickupauth_middleware_1.authenticate, async (req, res) => {
    try {
        const { files, folder } = req.body;
        if (!files || !Array.isArray(files) || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Files are required and should be a non-empty array.",
            });
        }
        const urls = await Promise.all(files.map(async (file) => {
            const key = `temp/${folder}/${Date.now()}-${(0, crypto_1.randomUUID)()}-${file.name}`;
            const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(pre_signed_url_route_1.s3, new client_s3_1.PutObjectCommand({
                Bucket: env_1.SYS_ENV.AWS_S3_BUCKET_NAME,
                Key: key,
                ContentType: file.type,
            }), { expiresIn: 3600 });
            return { uploadUrl, key };
        }));
        if (!urls || urls.length === 0) {
            return res.status(500).json({
                success: false,
                message: "Failed to generate pre-signed URLs.",
            });
        }
        return res.status(200).json({
            success: true,
            message: "Pre-signed URLs generated successfully.",
            urls,
        });
    }
    catch (error) {
        console.error("Error generating presigned URL:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while generating the presigned URL.",
        });
    }
});
exports.default = router;

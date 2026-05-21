"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../../../config/prisma");
const router = express_1.default.Router();
router.post("/", async (req, res) => {
    try {
        const { userDbId } = req.body;
        if (!userDbId) {
            return res.status(400).json({ error: "userDbId is required" });
        }
        const doorStepPickups = await prisma_1.prisma.doorstepPickup.findMany({
            where: { employeeId: userDbId },
        });
        // For each DoorstepPickup, fetch its respective Declaration and inject
        const dstpickupsWithDeclaration = await Promise.all(doorStepPickups.map(async (pickup) => {
            let declaration = null;
            if (pickup.orderId) {
                declaration = await prisma_1.prisma.declaration.findUnique({
                    where: { orderId: pickup.orderId },
                });
            }
            return { ...pickup, declaration };
        }));
        console.log("Fetched doorstep pickups with declarations:", dstpickupsWithDeclaration.length);
        res.status(200).json({
            success: true,
            user: {
                dstpickups: dstpickupsWithDeclaration,
            },
        });
    }
    catch (error) {
        console.error("Error in fetch-data route:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = router;

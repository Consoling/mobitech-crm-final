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
        const { orderId } = req.body;
        if (!orderId) {
            return res.status(400).json({ error: "orderId is required" });
        }
        const updateDeclaration = await prisma_1.prisma.declaration.update({
            where: {
                orderId: orderId
            },
            data: {
                isAccepted: true
            }
        });
        if (!updateDeclaration) {
            return res.status(404).json({ error: "Declaration not found" });
        }
        return res.status(200).json(updateDeclaration);
    }
    catch (error) {
        console.error("Error accepting declaration:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = router;

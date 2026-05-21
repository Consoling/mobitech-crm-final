
import express from "express";
import { prisma } from "../../../config/prisma";

const router = express.Router();

router.post("/check-declaration", async (req, res) => {
    try {
        const { orderId } = req.body;
        if (!orderId) {
            return res.status(400).json({ error: "orderId is required" });
        }
        const declaration = await prisma.declaration.findUnique({
            where: {
                orderId: orderId
            }
        })
        if (!declaration) {
            return res.status(404).json({ error: "Declaration not found" });
        }
        if (!declaration.isAccepted) {
            return res.status(200).json(false);
        }
        return res.status(200).json(declaration.isAccepted);
    } catch (error) {
        console.error("Error checking declaration:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
})

export default router
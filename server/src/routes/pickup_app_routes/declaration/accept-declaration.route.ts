
import express from "express";
import { prisma } from "../../../config/prisma";


const router = express.Router();


router.post("/", async(req, res) => {
    try {
        const {orderId} = req.body;
        if(!orderId){
            return res.status(400).json({ error: "orderId is required" });
        }
        const updateDeclaration = await prisma.declaration.update({
            where:{
                orderId: orderId
            },
            data:{
                isAccepted: true
            }
        })
        if(!updateDeclaration){
            return res.status(404).json({ error: "Declaration not found" });
        }
        return res.status(200).json(updateDeclaration);
    } catch (error) {
        console.error("Error accepting declaration:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
})


export default router
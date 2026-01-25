import express, { Request, Response } from "express";
import { prisma } from "../config/prisma";

const router = express.Router();

router.post('/get-sessions', async(req:Request, res:Response) => {
    try {
        const {sessionId} = req.body;

        if(!sessionId){
            return res.status(400).json({
                success: false,
                error: 'sessionId is required',
            });
        }

        const sessions = await prisma.session.findMany({
            where: {
                id: sessionId
            }
        })

        if(sessions.length === 0){
            return res.status(404).json({
                success: false,
                error: 'No sessions found for the given sessionId',
            });
        }
        return res.status(200).json({
            success: true,
            data: sessions,
        });
    } catch (error) {
        console.error('Error fetching sessions:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch sessions',
        });
    }
})


export default router;
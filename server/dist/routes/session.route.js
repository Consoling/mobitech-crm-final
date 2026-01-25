"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../config/prisma");
const router = express_1.default.Router();
router.post('/get-sessions', async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: 'sessionId is required',
            });
        }
        const sessions = await prisma_1.prisma.session.findMany({
            where: {
                id: sessionId
            }
        });
        if (sessions.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No sessions found for the given sessionId',
            });
        }
        return res.status(200).json({
            success: true,
            data: sessions,
        });
    }
    catch (error) {
        console.error('Error fetching sessions:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch sessions',
        });
    }
});
exports.default = router;

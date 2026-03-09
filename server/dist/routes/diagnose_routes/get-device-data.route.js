"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_js_1 = require("../../../lib/prisma.js");
const router = express_1.default.Router();
router.post("/", async (req, res) => {
    try {
        const { modelCode } = req.body;
        if (!modelCode) {
            return res.status(400).json({ error: "Mode code is required" });
        }
        const brands = await prisma_js_1.prisma.customModelBrand.findMany({
            where: { isActive: true },
            include: {
                models: {
                    where: {
                        isActive: true,
                        code: modelCode,
                    },
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: {
                name: "asc",
            },
        });
        let foundModel = null;
        for (const brand of brands) {
            if (brand.models && brand.models.length > 0) {
                foundModel = brand.models[0];
                break;
            }
        }
        console.log("Found model:", foundModel);
        return res.status(200).json({ result: "success", data: foundModel });
        // Find the first non-empty models array and return the first model
    }
    catch (error) {
        console.error("POST /api/check-custom-model error:", error);
        return res.status(500).json({ result: "error", message: error.message });
    }
});
exports.default = router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Device_1 = __importDefault(require("../../models/Device"));
const router = express_1.default.Router();
router.post("/get-models-by-brand", async (req, res) => {
    try {
        const { brand, device } = req.body;
        if (!brand) {
            return res.status(400).json({ error: "Brand is required" });
        }
        if (!device || (device !== "phones" && device !== "tablets")) {
            return res.status(400).json({
                error: "Device type is required and must be either 'phones' or 'tablets'",
            });
        }
        if (device === "phones") {
            const phones = await Device_1.default.find({
                brand: brand,
                category: "phone",
            }).lean();
            if (!phones || phones.length === 0) {
                return res
                    .status(404)
                    .json({ error: "No phone models found for the specified brand" });
            }
            console.log(`Found ${phones.length} phone models for brand ${brand}`);
            return res.status(200).json({
                count: phones.length,
                phones,
            });
        }
        const tablets = await Device_1.default.find({
            brand: brand,
            category: "tablet",
        }).lean();
        if (!tablets || tablets.length === 0) {
            return res
                .status(404)
                .json({ error: "No tablet models found for the specified brand" });
        }
        return res.status(200).json({
            count: tablets.length,
            tablets,
        });
    }
    catch (error) {
        console.error("POST /api/pickup-app/get-models-by-brand error:", error);
        return res
            .status(500)
            .json({ result: "error", message: "Internal server error" });
    }
});
exports.default = router;

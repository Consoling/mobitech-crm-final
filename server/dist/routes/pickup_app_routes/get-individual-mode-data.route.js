"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Device_1 = __importDefault(require("../../models/Device"));
const router = express_1.default.Router();
router.post("/get-individual-model-data", async (req, res) => {
    try {
        const { model } = await req.body;
        // console.log(model)
        if (!model) {
            return res.status(400).json({ error: "Model is required" });
        }
        const deviceData = await Device_1.default.findOne({
            smc: model,
        });
        if (!deviceData) {
            return res.status(404).json({ error: "Model not found" });
        }
        return res.status(200).json({
            deviceData,
        });
    }
    catch (error) {
        console.error("POST /api/pickup-app/get-ind-model-data error:", error);
        return res
            .status(500)
            .json({ result: "error", message: "Internal server error" });
    }
});
exports.default = router;

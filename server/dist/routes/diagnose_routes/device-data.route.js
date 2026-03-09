"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Device_1 = __importDefault(require("../../models/Device"));
const router = express_1.default.Router();
router.post("/get-device-data", async (req, res) => {
    try {
        const { modelCode } = req.body;
        // console.log("Received request to /get-device-data with modelCode:", modelCode);
        if (!modelCode) {
            return res.status(400).json({ error: "Mode code is required" });
        }
        // Find device by modelCode in the modelCodes array
        const foundModel = await Device_1.default.findOne({
            modelCodes: modelCode
        }).lean();
        if (!foundModel) {
            return res.status(404).json({ error: "Device model not found" });
        }
        // console.log("Found model:", foundModel);
        return res.status(200).json({ result: "success", data: foundModel });
    }
    catch (error) {
        console.error("POST /api/check-custom-model error:", error);
        return res.status(500).json({ result: "error", message: error.message });
    }
});
exports.default = router;

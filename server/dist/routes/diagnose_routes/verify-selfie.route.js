"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = express_1.default.Router();
router.post(`/upload-selfie-temp`, async (req, res) => {
    try {
        const { employeeId, selfieImage } = req.body;
        console.log("Received request to /upload-selfie-temp with employeeId:", employeeId);
        if (!employeeId) {
            console.error("employeeId is required in /upload-selfie route");
            return res.status(400).json({
                success: false,
                error: "employeeId is required",
            });
        }
        if (!selfieImage) {
            console.error("selfieImage is required in /upload-selfie route");
            return res.status(400).json({
                success: false,
                error: "selfieImage is required",
            });
        }
        // Validate base64 image format
        if (!selfieImage.startsWith("data:image/")) {
            return res.status(400).json({
                success: false,
                error: "Invalid image format. Must be base64 encoded image.",
            });
        }
        // Extract image type and base64 data
        const matches = selfieImage.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!matches) {
            return res.status(400).json({
                success: false,
                error: "Invalid base64 image format",
            });
        }
        const imageType = matches[1]; // jpeg, png, etc.
        const base64Data = matches[2];
        // Convert base64 to buffer
        const buffer = Buffer.from(base64Data, "base64");
        // Create directory if it doesn't exist
        const uploadDir = path_1.default.join(process.cwd(), "temp_diag_selfies");
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        // Generate filename
        const filename = `${employeeId}-${(0, uuid_1.v4)()}.${imageType}`;
        const filePath = path_1.default.join(uploadDir, filename);
        // Write file to disk
        fs_1.default.writeFileSync(filePath, buffer);
        const imageUrl = `/temp_diag_selfies/${filename}`;
        console.log("Selfie uploaded successfully:", filePath);
        return res.status(200).json({
            success: true,
            message: "Selfie uploaded successfully",
            imageUrl: imageUrl,
            filePath: filePath,
        });
    }
    catch (error) {
        console.error("Error in /upload-selfie route:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
});
exports.default = router;

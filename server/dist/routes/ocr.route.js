"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const tesseract_js_1 = __importDefault(require("tesseract.js"));
const multer_1 = __importDefault(require("multer"));
const sharp_1 = __importDefault(require("sharp"));
const imei_validator_1 = require("../utils/imei-validator");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
            return cb(new Error("Only image files allowed"));
        }
        cb(null, true);
    },
});
// 🚀 Accept up to 2 images at once
router.post("/ocr-extract", upload.array("images", 2), async (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ success: false, message: "No images uploaded" });
        }
        const allExtracted = [];
        // 🧠 Process each image separately
        for (const file of files) {
            const buffer = file.buffer;
            const processed = await (0, sharp_1.default)(buffer)
                .grayscale()
                .normalize()
                .sharpen()
                .resize({ width: 1600 })
                .toBuffer();
            const result = await tesseract_js_1.default.recognize(processed, "eng", {
                tessedit_char_whitelist: "0123456789IME/",
                tessedit_pageseg_mode: 6,
            });
            let rawText = result.data.text;
            console.log("OCR RESULT:", rawText);
            // Remove "/ 11" type software version
            rawText = rawText.replace(/\/\s*\d{2}/g, "");
            // Match any 15-digit IMEI
            const imeiRegex = /(\d{15})(?=\D|$)/g;
            let match;
            while ((match = imeiRegex.exec(rawText)) !== null) {
                const imei = match[1];
                if ((0, imei_validator_1.isValidIMEI)(imei) && !allExtracted.includes(imei)) {
                    allExtracted.push(imei);
                }
            }
        }
        // Deduplicate
        const unique = [...new Set(allExtracted)];
        const imei1 = unique[0] || null;
        const imei2 = unique[1] || null;
        let status = "NOT_FOUND";
        let message = "No IMEI detected";
        if (imei1 && imei2) {
            status = "COMPLETE";
            message = "Both IMEI numbers detected successfully.";
        }
        else if (imei1) {
            status = "PARTIAL";
            message = "Only one IMEI detected. Upload both screenshots if needed.";
        }
        return res.json({
            success: true,
            status,
            message,
            data: { imei1, imei2 },
        });
    }
    catch (error) {
        console.error("OCR ERROR:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.default = router;

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
const library_1 = require("@zxing/library");
const router = express_1.default.Router();
// MULTER
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("image/"))
            return cb(new Error("Only images allowed"));
        cb(null, true);
    },
});
// DETECT DARK UI
const isDarkImage = async (buffer) => {
    const stats = await (0, sharp_1.default)(buffer).stats();
    return stats.channels[0].mean < 80;
};
// BARCODE EXTRACTOR
async function extractBarcodeIMEI(buffer) {
    try {
        const { data, info } = await (0, sharp_1.default)(buffer)
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });
        const luminance = new library_1.RGBLuminanceSource(new Uint8ClampedArray(data), info.width, info.height);
        const bitmap = new library_1.BinaryBitmap(new library_1.HybridBinarizer(luminance));
        const reader = new library_1.MultiFormatReader();
        const result = reader.decode(bitmap);
        const txt = result.getText().trim();
        return txt.match(/\d{15}/g) || [];
    }
    catch (err) {
        return [];
    }
}
router.post("/ocr-extract", upload.array("images", 2), async (req, res) => {
    try {
        const files = req.files;
        if (!files?.length) {
            return res.status(400).json({ success: false, message: "No images uploaded" });
        }
        const allExtracted = new Set();
        let incompleteView = false;
        for (const file of files) {
            const original = file.buffer;
            const metadata = await (0, sharp_1.default)(original).metadata();
            const dark = await isDarkImage(original);
            // Crop IMEI text area
            const cropped = await (0, sharp_1.default)(original)
                .extract({
                top: 0,
                left: 0,
                width: metadata.width,
                height: Math.floor(metadata.height * 0.45),
            })
                .toBuffer();
            // OCR PREPROCESS
            const processed = dark
                ? await (0, sharp_1.default)(cropped)
                    .resize({ width: 2200 })
                    .modulate({ brightness: 1.8 })
                    .linear(1.9, -(128 * 0.9))
                    .gamma(1.3)
                    .grayscale()
                    .sharpen()
                    .threshold(155)
                    .toBuffer()
                : await (0, sharp_1.default)(cropped)
                    .resize({ width: 1600 })
                    .grayscale()
                    .normalize()
                    .sharpen()
                    .toBuffer();
            // OCR
            const ocr = await tesseract_js_1.default.recognize(processed, "eng", {
                tessedit_char_whitelist: "0123456789IME/",
            });
            let text = ocr.data.text;
            console.log("OCR:", text);
            const hasIMEI2Label = text.toLowerCase().includes("imei2") || text.includes("IMEI 2");
            // Remove /01 /18
            text = text.replace(/\/\s*\d{2}/g, "");
            // Extract IMEI via OCR
            const ocrMatches = text.match(/\d{15}/g) || [];
            for (const imei of ocrMatches) {
                if ((0, imei_validator_1.isValidIMEI)(imei))
                    allExtracted.add(imei);
            }
            if (hasIMEI2Label && ocrMatches.length === 0) {
                incompleteView = true;
            }
            // BARCODE FALLBACK
            const barcodeMatches = await extractBarcodeIMEI(original);
            console.log("BARCODE:", barcodeMatches);
            for (const imei of barcodeMatches) {
                if ((0, imei_validator_1.isValidIMEI)(imei))
                    allExtracted.add(imei);
            }
        }
        const arr = [...allExtracted];
        const imei1 = arr[0] || null;
        const imei2 = arr[1] || null;
        let status = "NOT_FOUND";
        let message = "IMEI not detected.";
        if (incompleteView && arr.length === 0) {
            status = "INCOMPLETE_VIEW";
            message =
                "IMEI label detected but number hidden. Please scroll or include full IMEI block.";
        }
        else if (imei1 && imei2) {
            status = "COMPLETE";
            message = "Both IMEIs extracted successfully.";
        }
        else if (imei1) {
            status = "PARTIAL";
            message = "Only one IMEI found. Upload the second screenshot.";
        }
        return res.json({
            success: true,
            status,
            message,
            data: { imei1, imei2 },
        });
    }
    catch (err) {
        console.error("OCR ERROR:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
});
exports.default = router;

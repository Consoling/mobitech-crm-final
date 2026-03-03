import express, { Request, Response } from "express";
import Tesseract from "tesseract.js";
import multer from "multer";
import sharp from "sharp";
import { isValidIMEI } from "../utils/imei-validator";

import {
  MultiFormatReader,
  RGBLuminanceSource,
  HybridBinarizer,
  BinaryBitmap,
} from "@zxing/library";

const router = express.Router();

// MULTER
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("Only images allowed"));
    cb(null, true);
  },
});

// DETECT DARK UI
const isDarkImage = async (buffer: Buffer) => {
  const stats = await sharp(buffer).stats();
  return stats.channels[0].mean < 80;
};

// BARCODE EXTRACTOR
async function extractBarcodeIMEI(buffer: Buffer): Promise<string[]> {
  try {
    const { data, info } = await sharp(buffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const luminance = new RGBLuminanceSource(new Uint8ClampedArray(data), info.width, info.height);
    const bitmap = new BinaryBitmap(new HybridBinarizer(luminance));
    const reader = new MultiFormatReader();

    const result = reader.decode(bitmap);
    const txt = result.getText().trim();

    return txt.match(/\d{15}/g) || [];
  } catch (err) {
    return [];
  }
}

router.post(
  "/ocr-extract",
  upload.array("images", 2),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files?.length) {
        return res.status(400).json({ success: false, message: "No images uploaded" });
      }

      const allExtracted = new Set<string>();
      let incompleteView = false;

      for (const file of files) {
        const original = file.buffer;
        const metadata = await sharp(original).metadata();
        const dark = await isDarkImage(original);

        // Crop IMEI text area
        const cropped = await sharp(original)
          .extract({
            top: 0,
            left: 0,
            width: metadata.width!,
            height: Math.floor(metadata.height! * 0.45),
          })
          .toBuffer();

        // OCR PREPROCESS
        const processed = dark
          ? await sharp(cropped)
              .resize({ width: 2200 })
              .modulate({ brightness: 1.8 })
              .linear(1.9, -(128 * 0.9))
              .gamma(1.3)
              .grayscale()
              .sharpen()
              .threshold(155)
              .toBuffer()
          : await sharp(cropped)
              .resize({ width: 1600 })
              .grayscale()
              .normalize()
              .sharpen()
              .toBuffer();

        // OCR
        const ocr = await Tesseract.recognize(processed, "eng", {
          tessedit_char_whitelist: "0123456789IME/",
        } as any);

        let text = ocr.data.text;
        console.log("OCR:", text);

        const hasIMEI2Label = text.toLowerCase().includes("imei2") || text.includes("IMEI 2");

        // Remove /01 /18
        text = text.replace(/\/\s*\d{2}/g, "");

        // Extract IMEI via OCR
        const ocrMatches = text.match(/\d{15}/g) || [];
        for (const imei of ocrMatches) {
          if (isValidIMEI(imei)) allExtracted.add(imei);
        }

        if (hasIMEI2Label && ocrMatches.length === 0) {
          incompleteView = true;
        }

        // BARCODE FALLBACK
        const barcodeMatches = await extractBarcodeIMEI(original);

        console.log("BARCODE:", barcodeMatches);
        for (const imei of barcodeMatches) {
          if (isValidIMEI(imei)) allExtracted.add(imei);
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
      } else if (imei1 && imei2) {
        status = "COMPLETE";
        message = "Both IMEIs extracted successfully.";
      } else if (imei1) {
        status = "PARTIAL";
        message = "Only one IMEI found. Upload the second screenshot.";
      }

      return res.json({
        success: true,
        status,
        message,
        data: { imei1, imei2 },
      });
    } catch (err) {
      console.error("OCR ERROR:", err);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

export default router;
import express, { Request, Response } from "express";
import Tesseract from "tesseract.js";
import multer from "multer";
import sharp from "sharp";
import { isValidIMEI } from "../utils/imei-validator";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files allowed"));
    }
    cb(null, true);
  },
});

// 🚀 Accept up to 2 images at once
router.post(
  "/ocr-extract",
  upload.array("images", 2),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ success: false, message: "No images uploaded" });
      }

      const allExtracted: string[] = [];

      // 🧠 Process each image separately
      for (const file of files) {
        const buffer = file.buffer;

        const processed = await sharp(buffer)
          .grayscale()
          .normalize()
          .sharpen()
          .resize({ width: 1600 })
          .toBuffer();

        const result = await Tesseract.recognize(processed, "eng", {
          tessedit_char_whitelist: "0123456789IME/",
          tessedit_pageseg_mode: 6,
        } as any);

        let rawText = result.data.text;
        console.log("OCR RESULT:", rawText);

        // Remove "/ 11" type software version
        rawText = rawText.replace(/\/\s*\d{2}/g, "");

        // Match any 15-digit IMEI
        const imeiRegex = /(\d{15})(?=\D|$)/g;
        let match;

        while ((match = imeiRegex.exec(rawText)) !== null) {
          const imei = match[1];
          if (isValidIMEI(imei) && !allExtracted.includes(imei)) {
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
      } else if (imei1) {
        status = "PARTIAL";
        message = "Only one IMEI detected. Upload both screenshots if needed.";
      }

      return res.json({
        success: true,
        status,
        message,
        data: { imei1, imei2 },
      });

    } catch (error) {
      console.error("OCR ERROR:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
);

export default router;

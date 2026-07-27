import express from "express";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { SYS_ENV } from "../../../utils/env";


const router = express.Router();

export const s3 = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId:
      SYS_ENV.AWS_ACCESS_KEY ||
      (() => {
        throw new Error("MB_S3_ADMIN_ACCESS_KEY is not defined");
      })(),
    secretAccessKey:
      SYS_ENV.AWS_SECRET_KEY ||
      (() => {
        throw new Error("MB_S3_ADMIN_SECRET_ACCESS_KEY is not defined");
      })(),
  },
});

router.post("/get-presigned-url", async (req, res) => {
  try {
    const { files } = req.body;

    if (!files) {
      return res.status(400).json({ error: "Files are required" });
    }

    const urls = await Promise.all(
      files.map(async (file: any) => {
        const key = `temp/${Date.now()}-${randomUUID()}-${file.name}`;
        const uploadUrl = await getSignedUrl(
          s3,
          new PutObjectCommand({
            Bucket: SYS_ENV.AWS_S3_BUCKET_NAME,
            Key: key,
            ContentType: file.type,
          }),
          { expiresIn: 3600 }
        );
        return { uploadUrl, key };
      })
    );

    if (!urls || urls.length === 0) {
      return res
        .status(500)
        .json({ error: "Failed to generate pre-signed URLs" });
    }

    return res.status(200).json({ urls });
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


export default router;
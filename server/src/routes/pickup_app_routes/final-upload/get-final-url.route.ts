import express from "express";
import { S3Client, PutObjectCommand, CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { SYS_ENV } from "../../../utils/env";


const router = express.Router();

const s3 = new S3Client({
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

router.post("/get-final-signed-url", async (req, res) => {
  try {
    const { fileKeys } = req.body;

    if (!fileKeys) {
      return res.status(400).json({ error: "File keys are required" });
    }

    const finalKeys = [];
    const missingKeys = [];

    for (const key of fileKeys) {
      const finalKey = key.replace("temp/", "final/pickup/");
      try {
        await s3.send(
          new CopyObjectCommand({
            Bucket: SYS_ENV.AWS_S3_BUCKET_NAME,
            CopySource: `${SYS_ENV.AWS_S3_BUCKET_NAME}/${key}`,
            Key: finalKey,
          })
        );
        await s3.send(
          new DeleteObjectCommand({
            Bucket: SYS_ENV.AWS_S3_BUCKET_NAME,
            Key: key,
          })
        );
        finalKeys.push(finalKey);
      } catch (err: any) {
        if (err.Code === "NoSuchKey") {
          missingKeys.push(key);
          console.warn(`Missing S3 key: ${key}`);
          continue;
        } else {
          throw err;
        }
      }
    }

    return res.status(200).json({ finalKeys, missingKeys });
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


export default router;
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_s3_1 = require("@aws-sdk/client-s3");
const env_1 = require("../../../utils/env");
const router = express_1.default.Router();
const s3 = new client_s3_1.S3Client({
    region: "ap-south-1",
    credentials: {
        accessKeyId: env_1.SYS_ENV.AWS_ACCESS_KEY ||
            (() => {
                throw new Error("MB_S3_ADMIN_ACCESS_KEY is not defined");
            })(),
        secretAccessKey: env_1.SYS_ENV.AWS_SECRET_KEY ||
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
                await s3.send(new client_s3_1.CopyObjectCommand({
                    Bucket: env_1.SYS_ENV.AWS_S3_BUCKET_NAME,
                    CopySource: `${env_1.SYS_ENV.AWS_S3_BUCKET_NAME}/${key}`,
                    Key: finalKey,
                }));
                await s3.send(new client_s3_1.DeleteObjectCommand({
                    Bucket: env_1.SYS_ENV.AWS_S3_BUCKET_NAME,
                    Key: key,
                }));
                finalKeys.push(finalKey);
            }
            catch (err) {
                if (err.Code === "NoSuchKey") {
                    missingKeys.push(key);
                    console.warn(`Missing S3 key: ${key}`);
                    continue;
                }
                else {
                    throw err;
                }
            }
        }
        return res.status(200).json({ finalKeys, missingKeys });
    }
    catch (error) {
        console.error("Error generating pre-signed URL:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = router;

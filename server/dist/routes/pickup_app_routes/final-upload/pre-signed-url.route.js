"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const crypto_1 = require("crypto");
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
router.post("/get-presigned-url", async (req, res) => {
    try {
        const { files } = req.body;
        if (!files) {
            return res.status(400).json({ error: "Files are required" });
        }
        const urls = await Promise.all(files.map(async (file) => {
            const key = `temp/${Date.now()}-${(0, crypto_1.randomUUID)()}-${file.name}`;
            const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3, new client_s3_1.PutObjectCommand({
                Bucket: env_1.SYS_ENV.AWS_S3_BUCKET_NAME,
                Key: key,
                ContentType: file.type,
            }), { expiresIn: 3600 });
            return { uploadUrl, key };
        }));
        if (!urls || urls.length === 0) {
            return res
                .status(500)
                .json({ error: "Failed to generate pre-signed URLs" });
        }
        return res.status(200).json({ urls });
    }
    catch (error) {
        console.error("Error generating pre-signed URL:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = router;

import { S3Client } from "@aws-sdk/client-s3";
import { SYS_ENV } from "./env";

export const s3Client = new S3Client({
  region: SYS_ENV.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
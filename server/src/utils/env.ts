import dotenv from "dotenv";

dotenv.config();


export const SYS_ENV = {
    PORT: process.env.PORT || 5000,
    JWT_SECRET: process.env.JWT_SECRET,
    REDIS_URL: process.env.REDIS_URL,
    MONGO_URL: process.env.MONGO_URL,
    NODE_ENV: process.env.NODE_ENV || "development",
    DATABASE_URL: process.env.DATABASE_URL,
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
    FRONTEND_URLS: process.env.FRONTEND_URLS?.split(',').map(url => url.trim()) || ["http://localhost:5173"],
    IMEI_CHECK_API_KEY: process.env.IMEI_CHECK_API_KEY,
    IMEI_CHECK_SERVICE: process.env.IMEI_CHECK_SERVICE || "11",
    AWS_REGION: process.env.MB_S3_REGION,
    AWS_S3_BUCKET_NAME: process.env.MB_S3_BUCKET_NAME,
    AWS_S3_PRESIGNED_URL_EXPIRES_IN_SECONDS: Number(process.env.MB_S3_PRESIGNED_URL_EXPIRES_IN_SECONDS || 900),
    FAST2SMS_API_KEY: process.env.FAST2SMS_API_KEY,
    FAST2SMS_API_ENDPOINT: process.env.FAST2SMS_API_ENDPOINT,
    QUICKEKYC_KEY: process.env.QUICKEKYC_KEY,
}
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
}
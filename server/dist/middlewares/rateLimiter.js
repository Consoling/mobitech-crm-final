"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalRateLimiter = globalRateLimiter;
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const redis_1 = require("../config/redis");
const rateLimiter = new rate_limiter_flexible_1.RateLimiterRedis({
    storeClient: redis_1.redisClient,
    points: 100, // 100 requests
    duration: 60, // per 60 seconds
    blockDuration: 60, // block for 1 minute if exceeded
    keyPrefix: "rl-global",
});
async function globalRateLimiter(req, res, next) {
    try {
        const ip = req.ip;
        await rateLimiter.consume(ip);
        return next();
    }
    catch (err) {
        return res.status(429).json({
            success: false,
            message: "Too many requests. Please try again later.",
        });
    }
}

import { Request, Response, NextFunction } from "express";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { redisClient } from "../config/redis";

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  points: 100, // 100 requests
  duration: 60, // per 60 seconds
  blockDuration: 60, // block for 1 minute if exceeded
  keyPrefix: "rl-global",
});

export async function globalRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const ip = req.ip;

    await rateLimiter.consume(ip!);

    return next();
  } catch (err) {
    return res.status(429).json({
      success: false,
      message: "Too many requests. Please try again later.",
    });
  }
}

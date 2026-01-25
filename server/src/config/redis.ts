import Redis from "ioredis";
import { SYS_ENV } from "../utils/env";

export const redisClient = new Redis(SYS_ENV.REDIS_URL!);

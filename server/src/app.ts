import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import { SYS_ENV } from "./utils/env";
import cors from "cors";
import morgan from "morgan";
import { globalRateLimiter } from "./middlewares/rateLimiter";
import { prisma } from "./config/prisma";
import { redisClient } from "./config/redis";

import authRoutes from "./routes/auth.route";
import mfaRoutes from "./routes/mfa.route";
import sessionRoutes from "./routes/session.route";
import modelsRoutes from "./routes/models.route";
import { connectDb } from "./lib/connectDb";
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: SYS_ENV.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(globalRateLimiter);
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req: Request, res: Response) => {
  res.send("Hello, World!");
});

app.get("/status", (_req: Request, res: Response) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use("/api/v1/sentinel", authRoutes);
app.use("/api/v1/sentinel", mfaRoutes);
app.use("/api/v1/sessions", sessionRoutes);
app.use("/api/v1/models", modelsRoutes);

app.post("/api/v1/get-disagnostics-data", (req, res) => {
  try {
    const body = req.body;
    console.log(body);
  } catch (error) {
    console.error(`Error in get diagnostics data route:`, error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

async function startServer() {
  await prisma
    .$connect()
    .then(() => {
      console.log("Connected to the database successfully.");
    })
    .catch((error) => {
      console.error("Database connection failed:", error);
      process.exit(1);
    });

  await redisClient
    .ping()
    .then(() => {
      console.log("Connected to Redis successfully.");
    })
    .catch((error) => {
      console.error("Redis connection failed:", error);
      process.exit(1);
    });

  await connectDb();
  app.listen(SYS_ENV.PORT, () => {
    console.log(`Server is running on http://localhost:${SYS_ENV.PORT}`);
  });
}

startServer();

export default app;

import express, { NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import { SYS_ENV } from "./utils/env";
import cors, { CorsOptions } from "cors";
import morgan from "morgan";
import { globalRateLimiter } from "./middlewares/rateLimiter";
import { prisma } from "./config/prisma";
import { redisClient } from "./config/redis";

import authRoutes from "./routes/auth.route";
import mfaRoutes from "./routes/mfa.route";
import sessionRoutes from "./routes/session.route";
import modelsRoutes from "./routes/models.route";
import qcReportRoutes from "./routes/qcreport.route";
import ocrRoutes from "./routes/ocr.route";
import deviceDataRoute from "./routes/device-data.route";
import diagnoseAuthRoutes from "./routes/diagnose_routes/auth.route";
import mfaDiagnoseRoutes from "./routes/diagnose_routes/mfa.route";
import verifySelfieRoutes from "./routes/diagnose_routes/verify-selfie.route";
import getDeviceFromModelCodeRoute from "./routes/diagnose_routes/device-data.route";
import uploadDiagDataRoute from "./routes/diagnose_routes/upload-diag-data.route";
import teamRoutes from "./routes/team.route";

import getModelsByBrandRoute from "./routes/pickup_app_routes/get-models-by-brand.route";
import getIndividualModelDataRoute from "./routes/pickup_app_routes/get-individual-mode-data.route";
import { connectDb } from "./lib/connectDb";
const app = express();
const allowedOrigins = Array.from(
  new Set([
    ...SYS_ENV.FRONTEND_URLS,
    "https://www.mobitech-crm.in",
    "https://mobitech-crm.in",
  ]),
);
const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

app.set("trust proxy", true);
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
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
app.use("/api/v1/reports", qcReportRoutes);
app.use("/api/v1/team", teamRoutes);
app.use("/api/v2/ocr", ocrRoutes);
app.use("/api/v2/device-data", deviceDataRoute);

app.use(`/api/v1/diagnose`, diagnoseAuthRoutes);
app.use(`/api/v1/diagnose`, mfaDiagnoseRoutes);
app.use(`/api/v1/diagnose`, verifySelfieRoutes);
app.use(`/api/v1/diagnose`, getDeviceFromModelCodeRoute);
app.use(`/api/v1/diagnose`, uploadDiagDataRoute);

app.use(`/api/v1/pickup`, getModelsByBrandRoute);
app.use(`/api/v1/pickup`, getIndividualModelDataRoute);
app.post("/api/v1/get-diagnostics-data", (req, res) => {
  try {
    const body = req.body;
    console.log(body);
  } catch (error) {
    console.error(`Error in get diagnostics data route:`, error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (
    err instanceof SyntaxError &&
    "status" in err &&
    (err as { status?: number }).status === 400 &&
    "body" in (err as Record<string, unknown>)
  ) {
    return res.status(400).json({
      result: "error",
      message: "Invalid JSON payload",
    });
  }

  return next(err);
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

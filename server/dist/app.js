"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const env_1 = require("./utils/env");
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const rateLimiter_1 = require("./middlewares/rateLimiter");
const prisma_1 = require("./config/prisma");
const redis_1 = require("./config/redis");
const auth_route_1 = __importDefault(require("./routes/auth.route"));
const mfa_route_1 = __importDefault(require("./routes/mfa.route"));
const session_route_1 = __importDefault(require("./routes/session.route"));
const models_route_1 = __importDefault(require("./routes/models.route"));
const qcreport_route_1 = __importDefault(require("./routes/qcreport.route"));
const connectDb_1 = require("./lib/connectDb");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: env_1.SYS_ENV.FRONTEND_URL,
    credentials: true,
}));
app.use((0, morgan_1.default)("dev"));
app.use(rateLimiter_1.globalRateLimiter);
app.use(express_1.default.urlencoded({ extended: true }));
app.get("/", (_req, res) => {
    res.send("Hello, World!");
});
app.get("/status", (_req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
});
app.use("/api/v1/sentinel", auth_route_1.default);
app.use("/api/v1/sentinel", mfa_route_1.default);
app.use("/api/v1/sessions", session_route_1.default);
app.use("/api/v1/models", models_route_1.default);
app.use("/api/v1/reports", qcreport_route_1.default);
app.post("/api/v1/get-disagnostics-data", (req, res) => {
    try {
        const body = req.body;
        console.log(body);
    }
    catch (error) {
        console.error(`Error in get diagnostics data route:`, error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
async function startServer() {
    await prisma_1.prisma
        .$connect()
        .then(() => {
        console.log("Connected to the database successfully.");
    })
        .catch((error) => {
        console.error("Database connection failed:", error);
        process.exit(1);
    });
    await redis_1.redisClient
        .ping()
        .then(() => {
        console.log("Connected to Redis successfully.");
    })
        .catch((error) => {
        console.error("Redis connection failed:", error);
        process.exit(1);
    });
    await (0, connectDb_1.connectDb)();
    app.listen(env_1.SYS_ENV.PORT, () => {
        console.log(`Server is running on http://localhost:${env_1.SYS_ENV.PORT}`);
    });
}
startServer();
exports.default = app;

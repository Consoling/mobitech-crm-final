"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDb = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("../utils/env");
const connectDb = async () => {
    try {
        const conn = await mongoose_1.default.connect(env_1.SYS_ENV.MONGO_URL);
        console.log("MongoDB connected", conn.connection.host);
    }
    catch (error) {
        console.error("MongoDB connection error:", error);
    }
};
exports.connectDb = connectDb;

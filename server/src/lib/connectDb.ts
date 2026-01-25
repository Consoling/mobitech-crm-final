import mongoose from "mongoose";
import { SYS_ENV } from "../utils/env";

export const connectDb = async () => {
  try {
    const conn = await mongoose.connect(SYS_ENV.MONGO_URL!);
    console.log("MongoDB connected", conn.connection.host);
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};

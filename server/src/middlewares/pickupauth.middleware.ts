import { Request, Response, NextFunction } from "express";
import jwt, { TokenExpiredError } from "jsonwebtoken";
import { SYS_ENV } from "../utils/env";


export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Missing or malformed token",
        code: "UNAUTHORIZED",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      SYS_ENV.ACCESS_TOKEN_SECRET!,
    ) as {
      sub: string;
      role: string;
      type: string;
    };

    if (decoded.type !== "ACCESS") {
      return res.status(401).json({
        success: false,
        message: "Invalid token type",
        code: "INVALID_TOKEN_TYPE",
      });
    }

    req.user = {
      userId: decoded.sub,
      role: decoded.role,
    };

    return next();
  } catch (error: any) {
    if (error instanceof TokenExpiredError || error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Access token expired",
        code: "TOKEN_EXPIRED",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid access token",
      code: "INVALID_TOKEN",
    });
  }
};

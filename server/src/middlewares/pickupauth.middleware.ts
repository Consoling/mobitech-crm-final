import { NextFunction, Request, Response } from "express";
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

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SYS_ENV.ACCESS_TOKEN_SECRET!) as {
      sub: string;
      role: string;
    };
    req.user = {
      userId: decoded.sub,
      role: decoded.role,
    };

    return next();
  } catch (error) {
 if (error instanceof TokenExpiredError) {
    return res.status(401).json({
      success: false,
      message: "Access token expired",
    });
  }

  return res.status(401).json({
    success: false,
    message: "Invalid access token",
  });
  }
};

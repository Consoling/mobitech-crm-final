import express, { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { redisClient } from "../../config/redis";
import jwt, { JwtPayload } from "jsonwebtoken";
import { SYS_ENV } from "../../utils/env";
import speakeasy from "speakeasy";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from "../../utils/genToken";
import { s3Client } from "../../utils/s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import {
  AuthRequest,
  authenticate,
} from "../../middlewares/pickupauth.middleware";
import { noCache } from "../../middlewares/nocache.middlware";

const router = express.Router();

router.use(noCache);

const S3_BUCKET_NAME = SYS_ENV.AWS_S3_BUCKET_NAME?.trim() ?? "";
const S3_REGION = SYS_ENV.AWS_REGION?.trim() ?? "";
const S3_PRESIGNED_URL_EXPIRES_IN_SECONDS = Number.isFinite(
  SYS_ENV.AWS_S3_PRESIGNED_URL_EXPIRES_IN_SECONDS,
)
  ? Math.max(60, SYS_ENV.AWS_S3_PRESIGNED_URL_EXPIRES_IN_SECONDS)
  : 900;

const getImagePayload = async (key: string | null) => {
  if (!key) {
    return null;
  }

  // console.log("Getting image payload for key:", key);

  // Fall back to presigned S3 URL if CDN not configured
  if (s3Client && S3_BUCKET_NAME) {
    try {
      const url = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: key,
        }),
        { expiresIn: S3_PRESIGNED_URL_EXPIRES_IN_SECONDS },
      );

      return {
        key,
        url,
      };
    } catch (error) {
      console.error("team image url signing error:", error);
    }
  }

  return {
    key,
    url: null,
  };
};

router.post(`/login/initiate`, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await prisma.user.findMany({
      where: {
        email: email.toLowerCase(),
      },
      select: {
        status: true,
        email: true,
        id: true,
        mfaEnabled: true,
      },
    });

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user[0]?.status != "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "User is not active",
      });
    }

    if (!user[0]?.mfaEnabled) {
      return res.status(403).json({
        success: false,
        message: "MFA not enabled.",
      });
    }

    const loginSessionId = crypto.randomUUID();
    await redisClient.set(
      `login:${loginSessionId}`,
      JSON.stringify({
        email: user[0]?.email,
        userId: user[0]?.id,
      }),
      "EX",
      60 * 5, // 5 minutes
    );

    return res.status(200).json({
      success: true,
      message: "Login initiated successfully",
      data: {
        loginSessionId,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

router.post(`/login/verify`, async (req: Request, res: Response) => {
  try {
    const { loginSessionId, otp } = req.body;

    if (!loginSessionId || !otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid Login",
      });
    }

    const sessionData = await redisClient.get(`login:${loginSessionId}`);

    if (!sessionData) {
      return res.status(400).json({
        success: false,
        message: "Invalid Login Session",
      });
    }

    const { userId } = JSON.parse(sessionData);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        status: true,
        mfaEnabled: true,
        mfaSecret: true,
        role: true,
        profileImage: true,
        manager: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
        technician: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
        fieldExecutive: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
        admin: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
        salesExecutive: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.status != "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "User is not active",
      });
    }

    const isValidOtp = speakeasy.totp.verify({
      secret: user.mfaSecret!,
      encoding: "base32",
      token: otp,
      window: 1,
    });

    if (!isValidOtp) {
      return res.status(401).json({
        success: false,
        message: "Invalid OTP",
      });
    }
    await redisClient.del(`login:${loginSessionId}`);
    const sessionId = crypto.randomUUID();

    let accessTokenPayload = {
      sub: user?.id,
      email: user?.email,
      role: user?.role,
      type: "ACCESS",
    };

    let refreshTokenPayload = {
      sub: user?.id,
      sessionId,
      type: "REFRESH",
    };

    const accessToken = generateAccessToken(accessTokenPayload);
    const refreshToken = generateRefreshToken(refreshTokenPayload);
    const hashedRefresh = hashToken(refreshToken);

    await prisma.pickupAppSession.create({
      data: {
        sessionId,
        refreshTokenHash: hashedRefresh,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        deviceName: req.headers["device-name"] as string | undefined,
        userAgent: req.headers["user-agent"] as string | undefined,
        ipAddress: req.ip,
        lastUsedAt: new Date(),
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    });

    const firstName =
      user.manager?.firstName ??
      user.technician?.firstName ??
      user.fieldExecutive?.firstName ??
      user.admin?.firstName ??
      user.salesExecutive?.firstName ??
      "";

    const lastName =
      user.manager?.lastName ??
      user.technician?.lastName ??
      user.fieldExecutive?.lastName ??
      user.admin?.lastName ??
      user.salesExecutive?.lastName ??
      "";
let img = await getImagePayload(user.profileImage);
    let dataToSend: any = {
      user: {
        employeeDbId: user.id,
        firstName,
        lastName,
        email: user.email,
        role: user.role,
        profileImage: img ? img?.url : null,
        employeeId:
          user.manager?.employeeId ??
          user.technician?.employeeId ??
          user.fieldExecutive?.employeeId ??
          user.admin?.employeeId ??
          user.salesExecutive?.employeeId ??
          null,
      },
    };

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        ...dataToSend,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

router.get(`/me`, authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        status: true,
        mfaEnabled: true,
        mfaSecret: true,
        role: true,
        profileImage: true,
        manager: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
        technician: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
        fieldExecutive: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
        admin: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
        salesExecutive: {
          select: {
            employeeId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.status != "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Account Disabled",
      });
    }
    const firstName =
      user.manager?.firstName ??
      user.technician?.firstName ??
      user.fieldExecutive?.firstName ??
      user.admin?.firstName ??
      user.salesExecutive?.firstName ??
      "";

    const lastName =
      user.manager?.lastName ??
      user.technician?.lastName ??
      user.fieldExecutive?.lastName ??
      user.admin?.lastName ??
      user.salesExecutive?.lastName ??
      "";
    let img = await getImagePayload(user.profileImage);

    // console.log("User profile image payload:", img);
    let dataToSend: any = {
      user: {
          employeeDbId: user.id,
        firstName,
        lastName,
        email: user.email,
        role: user.role,
        profileImage: img ? img?.url : null,
        employeeId:
          user.manager?.employeeId ??
          user.technician?.employeeId ??
          user.fieldExecutive?.employeeId ??
          user.admin?.employeeId ??
          user.salesExecutive?.employeeId ??
          null,
      },
    };

    // console.log("Data to send in /me route:", dataToSend);
    return res.status(200).json({
      success: true,
      message: "Session valid",
      data: dataToSend,
    });
  } catch (error) {
    console.error("Internal Server Error in /me route:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

router.post(`/refresh`, async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    let decoded: JwtPayload & {
      sub: string;
      sessionId: string;
      type: string;
    };
    try {
      decoded = jwt.verify(
        refreshToken,
        SYS_ENV.REFRESH_TOKEN_SECRET!,
      ) as JwtPayload & {
        sub: string;
        sessionId: string;
        type: string;
      };
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    if (decoded.type !== "REFRESH" || !decoded.sub || !decoded.sessionId) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }
    const session = await prisma.pickupAppSession.findUnique({
      where: {
        sessionId: decoded.sessionId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Session not found",
      });
    }

    if (session.revoked) {
      return res.status(401).json({
        success: false,
        message: "Session revoked",
      });
    }

    if (session.expiresAt.getTime() < Date.now()) {
      await prisma.pickupAppSession.delete({
        where: {
          sessionId: decoded.sessionId,
        },
      });
      return res.status(401).json({
        success: false,
        message: "Session expired",
      });
    }

    const incomingRefreshTokenHash = hashToken(refreshToken);

    if (incomingRefreshTokenHash !== session.refreshTokenHash) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    if (!session.user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (session.user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "User account is not active",
      });
    }

    const accessTokenPayload = {
      sub: session.user.id,
      email: session.user.email,
      role: session.user.role,
      type: "ACCESS",
    };

    const accessToken = generateAccessToken(accessTokenPayload);
    const refreshTokenRotated = generateRefreshToken({
      sub: session.user.id,
      sessionId: session.sessionId,
      type: "REFRESH",
    });
    const refreshTokenRotatedHash = hashToken(refreshTokenRotated);

    await prisma.pickupAppSession.update({
      where: {
        sessionId: decoded.sessionId,
      },
      data: {
        lastUsedAt: new Date(),
        refreshTokenHash: refreshTokenRotatedHash,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken,
        refreshToken: refreshTokenRotated,
      },
    });
  } catch (error) {
    console.error("Error in /refresh route:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

router.post(`/logout`, async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    let decoded: JwtPayload & {
      sessionId: string;
      sub: string;
      type: string;
    };

    try {
      decoded = jwt.verify(
        refreshToken,
        SYS_ENV.REFRESH_TOKEN_SECRET!,
      ) as JwtPayload & {
        sessionId: string;
        sub: string;
        type: string;
      };
    } catch {
      return res.status(200).json({
        success: true,
        message: "Logged out",
      });
    }

    if (decoded.type !== "REFRESH" || !decoded.sessionId) {
      return res.status(200).json({
        success: true,
        message: "Logged out",
      });
    }

    const isDeleted = await prisma.pickupAppSession.deleteMany({
      where: {
        sessionId: decoded.sessionId,
      },
    });

    console.log("Logout result:", isDeleted);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Error in /logout route:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

export default router;

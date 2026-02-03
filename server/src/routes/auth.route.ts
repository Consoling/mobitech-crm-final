import express, { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { compare } from "bcrypt";
import { UAParser } from "ua-parser-js";
import speakeasy from "speakeasy";
import jwt, { JwtPayload } from "jsonwebtoken";
import { SYS_ENV } from "../utils/env";
const router = express.Router();

router.post("/web-lint", async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res
        .status(400)
        .json({ message: "Phone and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { phone },
      select: {
        id: true,
        password: true,
        isAdmin: true,
        mfaEnabled: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid phone or password" });
    }

    const isValidPassword = await compare(password, user.password);
    // const isValidPassword = true
    if (!isValidPassword) {
      return res.status(400).json({ message: "Invalid phone or password" });
    } else if (!user.mfaEnabled) {
      return res.status(200).json({
        status: "MFA_NOT_ENABLED",
        user: {
          id: user.id,
          isAdmin: user.isAdmin,
          email: user.email,
        },
      });
    } else if (user.mfaEnabled && isValidPassword) {
      const tempToken = jwt.sign(
        {
          userId: user.id,
          phone,
        },
        SYS_ENV.JWT_SECRET!,
        { expiresIn: "10m" },
      );
      return res.status(200).json({
        status: "TOTP_REQUIRED",
        tempToken,
        user: {
          id: user.id,
          isAdmin: user.isAdmin,
        },
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error at Login Route" });
  }
});

router.post("/verify-wl-totp", async (req: Request, res: Response) => {
  const { totp, tempToken } = req.body;

  try {
    const decoded = jwt.verify(tempToken, SYS_ENV.JWT_SECRET!);

    if (typeof decoded === "string" || !("userId" in decoded)) {
      return res.status(400).json({ message: "Invalid or expired temp token" });
    }

    const userId = (decoded as JwtPayload & { userId: string }).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mfaSecret: true, isAdmin: true },
    });

    if (!user || !user.mfaSecret) {
      return res.status(400).json({ message: "Invalid user/session" });
    }

    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: "base32",
      token: totp,
      window: 1,
    });

    if (!isValid) {
      return res.status(400).json({ message: "Invalid TOTP code" });
    }

    // Create session with minimal info
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Extract IP
    const forwarded = req.headers["x-forwarded-for"];
    const ipAddress = Array.isArray(forwarded)
      ? forwarded[0]
      : (forwarded?.split(",")[0] ?? req.socket.remoteAddress ?? "127.0.0.1");

    // Extract UA
    const userAgent = req.headers["user-agent"] || "";

    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser();
    const os = parser.getOS();

    // Single session policy
    await prisma.session.deleteMany({ where: { userId } });

    const session = await prisma.session.create({
      data: {
        userId,
        expiresAt,
        ipAddress,
        userAgent,
        browser: `${browser.name || ""} ${browser.version || ""}`.trim() || null,
        os: `${os.name || ""} ${os.version || ""}`.trim() || null,

        // Location + device updated later
        location: null,
        latitude: null,
        longitude: null,
        device: "Unknown",
      },
    });

    // Check if request is from localhost
    const origin = req.headers.origin || '';
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
    
    const cookieOptions = {
      httpOnly: true,
      secure: !isLocalhost,  // Only use secure on production (not localhost)
      sameSite: isLocalhost ? ("lax" as const) : ("none" as const),  // Use "lax" for localhost, "none" for production
      path: "/",
      expires: expiresAt,
    };

    res.cookie("mbthcrm_session", session.id, cookieOptions);

    return res.json({
      success: true,
      userId,
      isAdmin: user.isAdmin,
      sessionId: session.id,
    });

  } catch (err) {
    return res.status(400).json({ message: "Invalid or expired temp token" });
  }
});

router.post("/session/update", async (req, res) => {
  const { sessionId, latitude, longitude, deviceInfo } = req.body;

  // Build device string from deviceInfo object
  let deviceString = null;
  if (deviceInfo) {
    const parser = new UAParser(deviceInfo.userAgent || "");
    const device = parser.getDevice();
    const parts: string[] = [];
    
    if (device.type) parts.push(device.type);
    if (device.vendor) parts.push(device.vendor);
    if (device.model) parts.push(device.model);
    
    deviceString = parts.length > 0 ? parts.join(" ") : "Desktop";
  }

  const updated = await prisma.session.update({
    where: { id: sessionId },
    data: {
      latitude: latitude || null,
      longitude: longitude || null,
      device: deviceString
    }
  });

  res.json({ success: true });
});

router.get("/me", async (req: Request, res: Response) => {
  try {
    const sessionId = req.cookies?.mbthcrm_session;
    if (!sessionId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true, userId: true, expiresAt: true },
    });

    if (!session || session.expiresAt.getTime() <= Date.now()) {
      return res.status(401).json({ message: "Session expired" });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, isAdmin: true, email: true },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid session" });
    }

    return res.status(200).json({
      authenticated: true,
      user,
      session: { id: session.id, expiresAt: session.expiresAt },
    });
  } catch (error) {
    console.error("/me error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/logout", async (req: Request, res: Response) => {
  try {
    const sessionId = req.cookies?.mbthcrm_session;
    if (sessionId) {
      await prisma.session.deleteMany({
        where: { id: sessionId },
      });
    }
    res.clearCookie("mbthcrm_session", { path: "/" });
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;

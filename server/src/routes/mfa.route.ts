import express, { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";
const router = express.Router();

router.post("/mfa/setup", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    const foundUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!foundUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!foundUser.email) {
      return res
        .status(400)
        .json({ message: "User does not have an email associated" });
    }

    const mfaSecret = generateSecret();
    const qrCodeData = generateURI({
      issuer: "Mobitech CRM",
      label: foundUser.email,
      secret: mfaSecret,
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeData);

    await prisma.user.update({
      where: { id: userId },
      data: { mfaSecret, mfaVerified: false },
    });

    return res.status(200).json({ qrCodeDataUrl });
  } catch (error: any) {
    console.error("MFA setup error:", error);
    res
      .status(500)
      .json({ message: "Internal server error at MFA Setup Route" });
  }
});

router.post("/mfa/verify", async (req: Request, res: Response) => {
  try {
    const { userId, token } = req.body;
    if (!userId || !token) {
      return res.status(400).json({
        message: "User ID and token are required",
      });
    }

    const foundUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!foundUser) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    if (!foundUser?.mfaSecret) {
      return res.status(400).json({
        message: "MFA is not set up for this user",
      });
    }

    const isValid = await verify({
      secret: foundUser.mfaSecret,
      token: token,
    });

    if (!isValid) {
      return res.status(400).json({
        message: "Invalid MFA token",
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { mfaVerified: true, mfaEnabled: true },
    });

    return res.status(200).json({
      message: "MFA verified successfully",
    });
  } catch (error) {
    console.error("MFA verify error:", error);
    res
      .status(500)
      .json({ message: "Internal server error at MFA Verify Route" });
  }
});

router.post("/mfa/check", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    const foundUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!foundUser) {
      return res.status(404).json({ message: "User not found" });
    }
    return res
      .status(200)
      .json({ isMfaEnabled: foundUser.mfaEnabled, userId: foundUser.id });
  } catch (error) {
    console.error("MFA check error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error at MFA Check Route" });
  }
});

export default router;

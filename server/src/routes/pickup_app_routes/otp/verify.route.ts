
import express from "express";
import "dotenv/config";
import { prisma } from "../../../config/prisma";

const router = express.Router();

router.post("/verify-otp-for-pickup", async (req, res) => {
  try {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({ error: "Identifier and OTP are required" });
    }

    // Check if OTP is valid
    const validOtp = await prisma.otp.findFirst({
      where: {
        identifier,
        otp,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!validOtp) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }
    await prisma.otp.update({
      where: { id: validOtp.id },
      data: { used: true },
    });

    // OTP is valid, proceed with the verification
    return res.json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


export default router;
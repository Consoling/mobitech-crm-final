import express, { Request, Response } from "express";
import { prisma } from "../../config/prisma";

import { verify } from "otplib";

const router = express.Router();

router.post(`/login`, async (req: Request, res: Response) => {
  try {
    const { employeeIdRaw } = req.body;

    if (!employeeIdRaw) {
      return res.status(400).json({
        success: false,
        error: "employeeId is required",
      });
    }

    let employeeId = `MT${employeeIdRaw}`;

    // Query all role tables in parallel
    const [admin, manager, technician, fieldExec, salesExec] =
      await Promise.all([
        prisma.admin.findUnique({
          where: { employeeId },
          select: { firstName: true, lastName: true, userId: true },
        }),
        prisma.manager.findUnique({
          where: { employeeId },
          select: { firstName: true, lastName: true, userId: true },
        }),
        prisma.technician.findUnique({
          where: { employeeId },
          select: { firstName: true, lastName: true, userId: true },
        }),
        prisma.fieldExecutive.findUnique({
          where: { employeeId },
          select: { firstName: true, lastName: true, userId: true },
        }),
        prisma.salesExecutive.findUnique({
          where: { employeeId },
          select: { firstName: true, lastName: true, userId: true },
        }),
      ]);

    // Find the first non-null result
    const employee = admin || manager || technician || fieldExec || salesExec;

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found",
      });
    }

    const isMfaEnabled = await prisma.user.findUnique({
      where: { id: employee.userId },
      select: { mfaEnabled: true },
    });

    return res.status(200).json({
      success: true,
      data: {
        firstName: employee.firstName,
        lastName: employee.lastName,
        userId: employee.userId,
        isMfaEnabled: isMfaEnabled?.mfaEnabled || false,
      },
      metaData: {
        type: "mobile",
        intent: "diagnosis",
        stage: "partial_auth",
        timestamp: new Date().toISOString(),

      }
    });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({
      success: false,
      error: "An error occurred during login",
    });
  }
});
router.post(`/verify-mfa`, async (req: Request, res: Response) => {
  
      try {
    const {totp, userId } = req.body;

   if(!totp){
    return res.status(400).json({
      success: false,
      error: "TOTP code is required",
    });
   }

   if(!userId){
    return res.status(400).json({
      success: false,
      error: "userId is required",
    });
   }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.mfaSecret || !user.mfaEnabled) {
      return res
        .status(400)
        .json({ error: "MFA is not enabled for this user" });
    }

    console.log("Verifying TOTP for user:", userId, "with secret:", user.mfaSecret, "and token:", totp);

     const result = await verify({ token: totp, secret: user.mfaSecret });
    if (!result.valid) {
      return res.status(401).json({ error: "Invalid TOTP token" });
    }

    return res.status(200).json({
      success: true,
      message: "MFA verification successful",
    });
 
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({
      success: false,
      error: "An error occurred during MFA verification",
    });
  }
});

export default router;

import express, { Request, Response } from "express";
import { prisma } from "../../../config/prisma";
import { redisClient } from "../../../config/redis";
import {
  authenticate,
  AuthRequest,
} from "../../../middlewares/pickupauth.middleware";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { s3 } from "../../pickup_app_routes/final-upload/pre-signed-url.route";
import { SYS_ENV } from "../../../utils/env";

const router = express.Router();

export const generateUniqueOrderId = async (): Promise<string> => {
  while (true) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let randomPart = "";

    for (let i = 0; i < 7; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const orderId = `${randomPart}`;

    const existing = await prisma.selfDiagnoseData.findUnique({
      where: {
        orderId,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return orderId;
    }
  }
};

router.post(
  "/create",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const orderId = await generateUniqueOrderId();

      const {deviceType, brand} = req.body

      if(!deviceType || !brand){
        return res.status(400).json({
          success: false,
          message: "Device type and brand are required.",
        });
      }

      const newSelfDiagnoseData = await prisma.selfDiagnoseData.create({
        data: {
          orderId,
          stage: "IN_PROGRESS",
          employeeId: req.user!.userId,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          deviceType,
         
        },
      });

      res.status(201).json({
        success: true,
        message: "Self-diagnosis data created successfully.",
        data: newSelfDiagnoseData,
      });
    } catch (error) {
      console.error("Error creating self-diagnosis data:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while creating the self-diagnosis data.",
      });
    }
  },
);

router.patch(
  "/update/:orderId",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { orderId } = req.params;

      const selfDiagnoseData = await prisma.selfDiagnoseData.findFirst({
        where: {
          orderId,
          employeeId: req.user!.userId,
          stage: "IN_PROGRESS",
        },
      });

      if (!selfDiagnoseData) {
        return res.status(404).json({
          success: false,
          message: "Self-diagnosis data not found.",
        });
      }

      const updatedSelfDiagnoseData = await prisma.selfDiagnoseData.update({
        where: {
          id: selfDiagnoseData.id,
        },
        data: {
          ...req.body,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Self-diagnosis data synced successfully.",
        data: updatedSelfDiagnoseData,
      });
    } catch (error) {
      console.error("Error updating self-diagnosis data:", error);

      return res.status(500).json({
        success: false,
        message: "An error occurred while updating the self-diagnosis data.",
      });
    }
  },
);
router.delete(
  "/delete/:id",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const orderId = req.params.id;

      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: "Order ID is required.",
        });
      }

      const deletedSelfDiagnoseData = await prisma.selfDiagnoseData.update({
        where: {
          orderId,
        },
        data: {
          stage: "CANCELLED",
        },
      });

      if (!deletedSelfDiagnoseData) {
        return res.status(404).json({
          success: false,
          message: "Self-diagnosis data not found.",
        });
      }
      res.status(200).json({
        success: true,
        message: "Self-diagnosis data deleted successfully.",
        // data: deletedSelfDiagnoseData,
      });
    } catch (error) {
      console.error("Error deleting self-diagnosis data:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while deleting the self-diagnosis data.",
      });
    }
  },
);

export default router;

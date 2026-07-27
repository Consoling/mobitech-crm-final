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

    const orderId = `MT-${randomPart}`;

    const existing = await prisma.doorstepPickup.findUnique({
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

      const newPickup = await prisma.doorstepPickup.create({
        data: {
          orderId,
          stage: "IN_PROGRESS",
          employeeId: req.user!.userId,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      res.status(201).json({
        success: true,
        message: "Pickup created successfully.",
        data: newPickup,
      });
    } catch (error) {
      console.error("Error creating pickup:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while creating the pickup.",
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

      const deletedPickup = await prisma.doorstepPickup.update({
        where: {
          orderId,
        },
        data: {
          stage: "CANCELLED",
        },
      });

      if (!deletedPickup) {
        return res.status(404).json({
          success: false,
          message: "Pickup not found.",
        });
      }
      res.status(200).json({
        success: true,
        message: "Pickup deleted successfully.",
        // data: deletedPickup,
      });
    } catch (error) {
      console.error("Error deleting pickup:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while deleting the pickup.",
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

      const pickup = await prisma.doorstepPickup.findFirst({
        where: {
          orderId,
          employeeId: req.user!.userId,
          stage: "IN_PROGRESS",
        },
      });

      if (!pickup) {
        return res.status(404).json({
          success: false,
          message: "Pickup not found.",
        });
      }

      const updatedPickup = await prisma.doorstepPickup.update({
        where: {
          id: pickup.id,
        },
        data: {
          ...req.body,
        },
      });

      return res.status(200).json({
        success: true,
        message: "Pickup synced successfully.",
        data: updatedPickup,
      });
    } catch (error) {
      console.error("Error updating pickup:", error);

      return res.status(500).json({
        success: false,
        message: "An error occurred while updating the pickup.",
      });
    }
  },
);

router.post(
  `/get-presigned-url`,
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { files, folder } = req.body;

      if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Files are required and should be a non-empty array.",
        });
      }

      const urls = await Promise.all(
        files.map(async (file: any) => {
          const key = `temp/${folder}/${Date.now()}-${randomUUID()}-${file.name}`;
          const uploadUrl = await getSignedUrl(
            s3,
            new PutObjectCommand({
              Bucket: SYS_ENV.AWS_S3_BUCKET_NAME,
              Key: key,
              ContentType: file.type,
            }),
            { expiresIn: 3600 },
          );
          return { uploadUrl, key };
        }),
      );

      if(!urls || urls.length === 0) {
        return res.status(500).json({
          success: false,
          message: "Failed to generate pre-signed URLs.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Pre-signed URLs generated successfully.",
        urls,
      });
    } catch (error) {
      console.error("Error generating presigned URL:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while generating the presigned URL.",
      });
    }
  },
);

export default router;

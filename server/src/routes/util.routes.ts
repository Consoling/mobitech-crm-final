import express, { Request, Response } from "express";
import DeviceVariant from "../models/DeviceVariant";
import { z } from "zod";

const router = express.Router();

router.get("/get-device-variants", async (_req: Request, res: Response) => {
  try {
    const variants = await DeviceVariant.find().lean();

    return res.status(200).json({
      status: "success",
      data: variants,
    });
  } catch (error) {
    console.error("GET /api/get-device-variants error:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

router.post("/add-device-variant", async (req: Request, res: Response) => {
  try {
    const variantSchema = z.object({
      variant: z.string().trim().min(1),
      isActive: z.boolean().optional().default(true),
    });

    const data = await variantSchema.parseAsync(req.body);

    const exists = await DeviceVariant.findOne({
      variant: data.variant,
    });

    if (exists) {
      return res.status(409).json({
        status: "error",
        message: "Device variant already exists.",
      });
    }

    const newVariant = await DeviceVariant.create(data);

    return res.status(201).json({
      status: "success",
      data: newVariant,
    });
  } catch (error) {
    console.error("POST /api/add-device-variant error:", error);

    return res.status(400).json({
      status: "error",
      message: "Invalid request data.",
    });
  }
});

router.patch(
  "/update-device-variant/:id",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const updateSchema = z.object({
        variant: z.string().trim().min(1).optional(),
        isActive: z.boolean().optional(),
      });

      const updateData = await updateSchema.parseAsync(req.body);

      if (updateData.variant) {
        const exists = await DeviceVariant.findOne({
          variant: updateData.variant,
          _id: { $ne: id },
        });

        if (exists) {
          return res.status(409).json({
            status: "error",
            message: "Device variant already exists.",
          });
        }
      }

      const updatedVariant = await DeviceVariant.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true,
          runValidators: true,
        },
      ).lean();

      if (!updatedVariant) {
        return res.status(404).json({
          status: "error",
          message: "Device variant not found.",
        });
      }

      return res.status(200).json({
        status: "success",
        data: updatedVariant,
      });
    } catch (error) {
      console.error("PATCH /api/update-device-variant/:id error:", error);

      return res.status(400).json({
        status: "error",
        message: "Invalid request data.",
      });
    }
  },
);

export default router;

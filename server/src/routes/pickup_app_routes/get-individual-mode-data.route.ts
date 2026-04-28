import express, { Request, Response } from "express";
import Device from "../../models/Device";

const router = express.Router();

router.post(
  "/get-individual-model-data",
  async (req: Request, res: Response) => {
    try {
      const { model } = await req.body;
      // console.log(model)
      if (!model) {
        return res.status(400).json({ error: "Model is required" });
      }
      const deviceData = await Device.findOne({
        smc: model,
      });

      if (!deviceData) {
        return res.status(404).json({ error: "Model not found" });
      }

      return res.status(200).json({
        deviceData,
      });
    } catch (error) {
      console.error("POST /api/pickup-app/get-ind-model-data error:", error);
      return res
        .status(500)
        .json({ result: "error", message: "Internal server error" });
    }
  },
);


export default router;
import express, { Request, Response } from "express";
import Device from "../../models/Device";

const router = express.Router();

router.post("/get-models-by-brand", async (req: Request, res: Response) => {
  try {
    const { brand, device } = req.body;

    if (!brand) {
      return res.status(400).json({ error: "Brand is required" });
    }

    if (!device || (device !== "phones" && device !== "tablets")) {
      return res.status(400).json({
        error:
          "Device type is required and must be either 'phones' or 'tablets'",
      });
    }

    if (device === "phones") {
      const phones = await Device.find({
        brand: brand,
        category: "phone",
      }).lean();

      if (!phones || phones.length === 0) {
        return res
          .status(404)
          .json({ error: "No phone models found for the specified brand" });
      }

     

      return res.status(200).json({
        count: phones.length,
         phones,
      });
    }

    const tablets = await Device.find({
      brand: brand,
      category: "tablet",
    }).lean();

    if (!tablets || tablets.length === 0) {
      return res
        .status(404)
        .json({ error: "No tablet models found for the specified brand" });
    }

    return res.status(200).json({
      count: tablets.length,
      tablets,
    });
  } catch (error) {
    console.error("POST /api/pickup-app/get-models-by-brand error:", error);
    return res
      .status(500)
      .json({ result: "error", message: "Internal server error" });
  }
});

export default router;
import express, { Request, Response } from "express";
import Device from "../../models/Device";



const router = express.Router();
router.post("/get-device-data", async (req: Request, res: Response) => {
  try {
    const { modelCode } = req.body;


    // console.log("Received request to /get-device-data with modelCode:", modelCode);
    if (!modelCode) {
      return res.status(400).json({ error: "Mode code is required" });
    }

    // Find device by modelCode in the modelCodes array
    const foundModel = await Device.findOne({
      modelCodes: modelCode
    }).lean();

    if(!foundModel){
        return res.status(404).json({ error: "Device model not found" });
    }

    // console.log("Found model:", foundModel);

    return res.status(200).json({result: "success", data: foundModel });
  } catch (error: any) {
    console.error("POST /api/check-custom-model error:", error);

    return res.status(500).json({ result: "error", message: error.message });
  }
});

export default router;

import axios from "axios";
import express, { Request, Response } from "express";
import Device from "../../models/Device";
import IMEIVerifiedDevice from "../../models/IMEIVerifiedDevice";

const router = express.Router();
router.post("/get-device-data", async (req: Request, res: Response) => {
  try {
    const { modelCode } = req.body;

    // console.log("Received request to /get-device-data with modelCode:", modelCode);
    if (!modelCode) {
      return res.status(400).json({ error: "Mode code is required" });
    }

    console.log("Searching for device with model code:", modelCode);

    // Find device by modelCode in the modelCodes array

    // Step 1 - Try exact match first for model codes that exactly match the provided model code
    let foundModel = await Device.findOne({
      modelCodes: modelCode,
    }).lean();

    // Step 2 - If not found, try regex match for model codes that start with the provided model code

    if (!foundModel) {
      foundModel = await Device.findOne({
        modelCodes: {
          $regex: `^${modelCode}`,
          $options: "i",
        },
      }).lean();
    }

    if (!foundModel) {
      return res.status(404).json({ error: "Device not found" });
    }

    // console.log("Found model:", foundModel);

    return res.status(200).json({ result: "success", data: foundModel });
  } catch (error: any) {
    console.error("POST /api/check-custom-model error:", error);

    return res.status(500).json({ result: "error", message: error.message });
  }
});

router.post(`/get-dev-ext`, async (req: Request, res: Response) => {
  try {
    const { imei } = req.body;
    const imeiRegex = /^\d{15}$/;
    if (!imei) {
      return res.status(400).json({ error: "IMEI is required" });
    }
    if (!imeiRegex.test(imei)) {
      return res.status(400).json({ error: "Invalid IMEI format" });
    }

    // ✅ 1. CHECK DB FIRST
    const existing = await IMEIVerifiedDevice.findOne({ imei }).lean();

    if (existing) {
      return res.status(200).json({
        result: "success",
        source: "db",
        data: existing,
      });
    }


    // ✅ 2. CALL EXTERNAL API
    const url =
      "https://alpha.imeicheck.com/api/php-api/create" +
      `?key=${process.env.IMEI_CHECK_API_KEY}` +
      `&service=${process.env.IMEI_CHECK_SERVICE}` +
      `&imei=${imei}`;

    const response = await axios.get(url, {
      timeout: 5000,
      validateStatus: () => true,
    });

    const data = response.data;

    if (!data || !data.status) {
      return res.status(502).json({
        result: "error",
        message: "Invalid response from external API",
      });
    }

    // ✅ 3. SUCCESS FROM API
    if (data.status === "success") {
      const deviceData = {
        imei: data.imei,
        brand: data.object?.brand,
        model: data.object?.model,
        name: data.object?.name,
      };

      // ✅ 4. SAVE TO DB (cache)
      try {
        await IMEIVerifiedDevice.create(deviceData);
      } catch (err) {
        // ignore duplicate error safely
        console.error("DB save error:", err);
      }

      return res.status(200).json({
        result: "success",
        source: "api",
        data: deviceData,
      });
    }

    // ✅ 4. FAILED IMEI
    if (data.status === "failed") {
      return res.status(400).json({
        result: "failed",
        message: data.response || "IMEI check failed",
      });
    }

    // ✅ 5. API ERROR
    if (data.status === "error") {
      return res.status(502).json({
        result: "error",
        message: data.response || "External API error",
      });
    }

    // fallback
    return res.status(500).json({
      result: "error",
      message: "Unknown API response",
    });

  } catch (error: any) {
    console.error("Error in get device ext route:", error.message);

    return res.status(500).json({
      result: "error",
      message: "Internal Server Error",
    });
  }
});

export default router;

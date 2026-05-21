import { SYS_ENV } from './../../../utils/env';
import express from "express";


const router = express.Router();

router.post("/generate-otp", async (req, res) => {
  try {
    const { id_number } = req.body;

    if (!id_number) {
      return res.status(400).json({ error: "ID number is required" });
    }

    const response = await fetch(
      "https://api.quickekyc.com/api/v1/aadhaar-v2/generate-otp",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: SYS_ENV.QUICKEKYC_KEY,
          id_number,
        }),
      }
    );

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error("Error generating OTP:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;

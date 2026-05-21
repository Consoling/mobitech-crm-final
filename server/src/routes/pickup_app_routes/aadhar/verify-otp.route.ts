import { SYS_ENV } from './../../../utils/env';
import express from "express";


const router = express.Router();

router.post("/verify-otp", async (req, res) => {
  try {
    const { request_id, otp } = req.body;

    if (!request_id || !otp) {
      return res.status(400).json({ error: "Request ID and OTP are required" });
    }

    const response = await fetch(
      "https://api.quickekyc.com/api/v1/aadhaar-v2/submit-otp",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: SYS_ENV.QUICKEKYC_KEY,
          request_id,
          otp,
        }),
      }
    );

    const data = await response.json();

    console.log("OTP Verification Response:", data);
    return res.status(response.status).json(data);
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;

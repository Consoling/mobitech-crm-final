import express from "express";
import "dotenv/config";
import { SYS_ENV } from "../../../utils/env";

const router = express.Router();

router.post("/verify-upi", async (req, res) => {
  try {
    const { upi_id } = req.body;
    if (!upi_id)
      return res.status(400).json({ message: "Missing required fields" });

    const response = await fetch(
      "https://api.quickekyc.com/api/v1/bank-verification/upi-verification",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: SYS_ENV.QUICKEKYC_KEY,
          upi_id,
        }),
      }
    );

    const data = await response.json();
    if (data.status_code !== 200) {
      return res.status(data.status_code).json({
        message: data.message || "Failed to verify UPI ID",
        res_code: data.status_code || "ERROR",
      });
    } else {
      console.log(data);

      res.status(200).json({
        message: "UPI ID verified successfully",
        res_code: data.status_code || "SUCCESS",
        data: data.data,
      });
    }
  } catch (error) {
    console.error("Error verifying UPI ID:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;

import { SYS_ENV } from './../../../utils/env';
import express from "express";
import "dotenv/config";

const router = express.Router();

router.post("/verify-bank", async (req, res) => {
  try {
    const { id_number, ifsc } = req.body;
    if (!id_number || !ifsc) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const response = await fetch(
      "https://api.quickekyc.com/api/v1/bank-verification",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: SYS_ENV.QUICKEKYC_KEY,
          id_number,
          ifsc,
        }),
      }
    );

    const data = await response.json();

    if (data.status_code !== 200) {
      return res.status(data.status_code).json({
        message: data.message || "Failed to verify Bank details",
        res_code: data.status_code || "ERROR",
      });
    } else {
      return res.status(200).json({
        message: "Bank details verified successfully",
        res_code: data.status_code || "SUCCESS",
        data: {
          accountExists: data.data.account_exists,
          fullName: data.data.full_name,
        },
      });
    }
  } catch (error) {
    console.error("Error verifying bank details:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;

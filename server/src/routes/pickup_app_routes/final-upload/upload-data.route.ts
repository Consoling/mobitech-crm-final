import express from "express";
import { prisma } from "../../../config/prisma";


const router = express.Router();

// Accept all DoorstepPickup fields, only orderId is mandatory
router.post("/save-doorstep-pickup", async (req, res) => {
  try {
    const { orderId, ...rest } = req.body;

    // console.log("Request body:", req.body);
    if (!orderId) {
      return res.status(400).json({ error: "orderId is required" });
    } 

    const allowedFields = [
      "employeeId",
      "variant",
      "imei1",
      "imei2",
      "deviceFrontImage",
      "deviceBackImage",
      "diagnosticsProcess",
      "mbdgReport",
      "diagnosticsProcessInit",
      "qcReportInit",
      "qcReport",
      "repairRequired",
      "repairStatus",
      "accessories",
      "deviceAge",
      "warrantyType",
      "hasGstBill",
      "gstInvoice",
      "boxImeiMatch",
      "customerName",
      "mobileNumber",
      "addressProofType",
      "aadharNumber",
      "address",
      "fullAddress",
      "aadharFrontImage",
      "aadharBackImage",
      "epicNumber",
      "voterIdFrontImage",
      "voterIdBackImage",
      "isAadharVerified",
      "voterIdVerified",
      "customerSignature",
      "deviceReset",
      "deviceStartScreenImage",
      "customerProofImage",
      "customerDeclaration",
      "cashPaymentReceiptImage",
      "paymentMode",
      "exchangeModel",
      "newModelIMEI",
      "manualQcReport",
      "remarks",
      "finalAmount",
      "sellingAmount",
      "upiId",
      "upiBeneficiaryName",
      "isUpiVerified",
      "isUpiSaved",
      "bankName",
      "accountNumber",
      "confirmAccountNumber",
      "ifscCode",
      "bankBeneficiaryName",
      "isBankDetailsVerified",
      "isBankDetailsSaved",
      "paymentStatus",
      "utrrrnnumber",
      "paidBy",
      "purchaserBankName",
      "purchaserPaymentMode",
      "isMobileNumberVerified",
      "isDeclarationSigned",
      "phoneVerified",
      "repairParts",
      "repairDate",
      "assignedBC",
      "purchaseAmount",
    ];
    const updateData: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in rest) updateData[key] = (rest as Record<string, any>)[key];
    }

    const createData = { orderId, ...updateData };

    // Upsert: create if not exists, update if exists
    const result = await prisma.doorstepPickup.upsert({
      where: { orderId },
      update: updateData,
      create: createData,
    });

    res.status(200).json({ success: true, pickup: result });
  } catch (error) {
    console.error("Error in upload-data route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

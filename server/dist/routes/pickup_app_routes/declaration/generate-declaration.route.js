"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("dotenv/config");
const prisma_1 = require("../../../config/prisma");
const router = express_1.default.Router();
router.post("/generate-declaration", async (req, res) => {
    try {
        console.log("=== GENERATE DECLARATION ROUTE START ===");
        console.log("Request body received:", JSON.stringify(req.body, null, 2));
        let { mtype, modelName, customerName, orderId, brand, model, smc, imei1, imei2, variant, bluetooth, gps, wifi, proximity, multiTouch, screenCalibration, speaker, earReceiver, microphone, frontCamera, backCamera, sim, fingerprint, chargingPort, audioJack, reportId, finalAmount, phoneNumber, employeeId } = req.body;
        console.log("Request body:", req.body);
        console.log("=== STARTING VALIDATION ===");
        console.log("mtype:", mtype);
        // Validate required fields for MBDG
        if (mtype === "mbdg") {
            console.log("=== VALIDATING MBDG FIELDS ===");
            const requiredFieldsMbdg = {
                finalAmount,
                orderId,
                modelName,
                customerName,
                smc,
                imei1,
                imei2,
                variant,
                bluetooth,
                gps,
                wifi,
                proximity,
                multiTouch,
                screenCalibration,
                speaker,
                earReceiver,
                microphone,
                frontCamera,
                backCamera,
                sim,
                fingerprint,
                chargingPort,
                audioJack,
                phoneNumber
            };
            const missingFields = [];
            for (const [fieldName, fieldValue] of Object.entries(requiredFieldsMbdg)) {
                if (fieldName === 'sim') {
                    // Special check for sim field which can be undefined
                    if (fieldValue === undefined) {
                        missingFields.push(fieldName);
                    }
                }
                else if (!fieldValue) {
                    missingFields.push(fieldName);
                }
            }
            if (missingFields.length > 0) {
                console.log("Missing fields:", missingFields);
                return res.status(400).json({
                    error: `Missing required fields for Mobitech Diagnose: ${missingFields.join(', ')}`
                });
            }
        }
        // Validate required fields for SFDG
        else if (mtype === "sfdg") {
            console.log("=== VALIDATING SFDG FIELDS ===");
            const requiredFieldsSfdg = {
                variant,
                imei1,
                imei2,
                reportId,
                orderId,
                finalAmount,
                phoneNumber
            };
            const missingFields = [];
            for (const [fieldName, fieldValue] of Object.entries(requiredFieldsSfdg)) {
                if (!fieldValue) {
                    missingFields.push(fieldName);
                }
            }
            if (missingFields.length > 0) {
                return res.status(400).json({
                    error: `Missing required fields for Self Diagnose: ${missingFields.join(', ')}`
                });
            }
        }
        console.log("=== VALIDATION PASSED, CHECKING EXISTING DECLARATION ===");
        console.log("Looking for existing declaration with orderId:", orderId);
        const exisitingDeclaration = await prisma_1.prisma.declaration.findUnique({
            where: {
                orderId: orderId,
            },
        });
        console.log("Existing declaration found:", exisitingDeclaration);
        // if (exisitingDeclaration.isAccepted) {
        //   return res
        //     .status(400)
        //     .json({ error: "Declaration already accepted for this orderId" });
        // }
        if (!exisitingDeclaration) {
            console.log("=== NO EXISTING DECLARATION, CREATING NEW ONE ===");
            if (mtype === "sfdg") {
                console.log("=== FETCHING MANUAL DIAGNOSTICS REPORT ===");
                console.log("reportId:", reportId);
                const report = await prisma_1.prisma.manualDiagnosticsResult.findUnique({
                    where: {
                        diagnoseId: reportId,
                    },
                });
                console.log("Manual diagnostics report found:", report);
                if (!report) {
                    console.error("=== REPORT NOT FOUND ===");
                    return res.status(400).json({ error: "Failed to fetch report data" });
                }
                console.log("=== PROCESSING REPORT DATA ===");
                bluetooth = report.bluetooth === "Working" ? "pass" : "fail";
                gps = report.gps === "Working" ? "pass" : "fail";
                wifi = report.wifi === "Working" ? "pass" : "fail";
                proximity = report.proximity === "Working" ? "pass" : "fail";
                multiTouch = report.screenTouch === "Working" ? "pass" : "fail";
                screenCalibration = report.screenTouch === "Working" ? "pass" : "fail";
                speaker = report.speaker === "Working" ? "pass" : "fail";
                earReceiver = report.speaker === "Working" ? "pass" : "fail";
                microphone = report.microphone === "Working" ? "pass" : "fail";
                frontCamera = report.frontCamera === "Working" ? "pass" : "fail";
                backCamera = report.backCamera === "Working" ? "pass" : "fail";
                if (report.sim === "Both SIM are working") {
                    sim = "pass";
                }
                else if (report.sim === "Single SIM Working") {
                    sim = "1 SIM working";
                }
                else if (report.sim === "Not working") {
                    sim = "fail";
                }
                if (report.fingerprint === "Working") {
                    fingerprint = "pass";
                }
                else if (report.fingerprint === "Not Available") {
                    fingerprint = "unsupported";
                }
                else if (report.fingerprint === "Not working") {
                    fingerprint = "fail";
                }
                chargingPort = report.chargingPort === "Working" ? "pass" : "fail";
                audioJack = report.audioJack === "Working" ? "pass" : "fail";
                console.log("=== REPORT DATA PROCESSED ===");
            }
            console.log("=== CREATING DECLARATION IN DATABASE ===");
            console.log("Declaration data to be created:", {
                orderId,
                brand,
                model,
                smc,
                imei1,
                imei2,
                variant,
                bluetooth,
                gps,
                wifi,
                proximity,
                multiTouch,
                screenCalibration,
                speaker,
                earReceiver,
                microphone,
                frontCamera,
                backCamera,
                sim,
                fingerprint,
                chargingPort,
                audioJack,
                finalAmount,
                phoneNumber,
                modelName,
                customerName,
            });
            const declaration = await prisma_1.prisma.declaration.create({
                data: {
                    orderId,
                    smc,
                    imei1,
                    imei2,
                    variant,
                    bluetooth,
                    gps,
                    wifi,
                    proximity,
                    multiTouch,
                    screenCalibration,
                    speaker,
                    earReceiver,
                    microphone,
                    frontCamera,
                    backCamera,
                    sim,
                    fingerprint,
                    chargingPort,
                    audioJack,
                    finalAmount,
                    phoneNumber,
                    modelName,
                    customerName,
                },
            });
            console.log("=== DECLARATION CREATED SUCCESSFULLY ===");
            console.log("Created declaration:", declaration);
            if (!declaration) {
                console.error("=== DECLARATION CREATION FAILED ===");
                return res.status(500).json({ error: "Failed to create declaration" });
            }
            else {
                console.log("=== PREPARING WHATSAPP MESSAGE ===");
                let var2 = customerName || "";
                let var3 = modelName || "";
                let var1 = `https://www.mobitech-crm.in/declaration/${orderId}` || "";
                let cphoneNumber = `+91${phoneNumber}`;
                console.log("phoneNumber:", phoneNumber);
                const variables_values = `${var1}|${var2}|${var3}`;
                let whatsappRes = fetch(`https://www.fast2sms.com/dev/whatsapp?authorization=${process.env.FAST2SMS_API_KEY}&numbers=+91${cphoneNumber}
          &message_id=7379&variables_values=${encodeURIComponent(variables_values)}`, {
                    method: "GET",
                });
                // const whatsappResponseBody = await whatsappRes.json();
                const whatsappResponse = await whatsappRes;
                console.log("=== SENDING WHATSAPP MESSAGE ===");
                const whatsappSuccess = whatsappResponse.ok;
                console.log("WhatsApp success status:", whatsappSuccess);
                if (whatsappSuccess) {
                    console.log("=== WHATSAPP MESSAGE SENT SUCCESSFULLY ===");
                    const sentMediums = [];
                    if (whatsappSuccess)
                        sentMediums.push("WhatsApp");
                    console.log("sentMediums:", sentMediums);
                    return res.json({
                        success: true,
                        message: `Declaration sent via ${sentMediums.join(" and ")}`,
                        mediums: sentMediums,
                        whatsappStatus: whatsappSuccess ? "sent" : "failed",
                    });
                }
                else {
                    console.error("=== WHATSAPP MESSAGE FAILED ===");
                    console.error("Failed to send WhatsApp message:", whatsappResponse);
                    return res.status(500).json({
                        error: "Failed to send declaration via  WhatsApp",
                    });
                }
            }
        }
        else if (exisitingDeclaration && exisitingDeclaration.isAccepted) {
            console.log("=== DECLARATION ALREADY ACCEPTED ===");
            return res.status(400).json({
                error: "Declaration already accepted for this orderId",
            });
        }
        else if (exisitingDeclaration && !exisitingDeclaration.isAccepted) {
            console.log("=== DECLARATION EXISTS BUT NOT ACCEPTED, RESENDING ===");
            const customerName = exisitingDeclaration.customerName;
            const modelName = exisitingDeclaration.modelName;
            const orderId = exisitingDeclaration.orderId;
            let phoneNumber = `+91${exisitingDeclaration.phoneNumber}`;
            console.log("phoneNumber:", phoneNumber);
            let var2 = customerName || "";
            let var3 = modelName || "";
            let var1 = `https://www.mobitech-crm.in/declaration/${orderId}` || "";
            const variables_values = `${var1}|${var2}|${var3}`;
            console.log("Resend WhatsApp variables:", variables_values);
            let whatsappRes = await fetch(`https://www.fast2sms.com/dev/whatsapp?authorization=${process.env.FAST2SMS_API_KEY}&numbers=${phoneNumber}
        &message_id=7379&variables_values=${encodeURIComponent(variables_values)}`, {
                method: "GET",
            });
            console.log("Resend WhatsApp response:", await whatsappRes.json());
            let whatsappResponse = whatsappRes;
            // Wait for both requests to complete
            const whatsappSuccess = whatsappResponse.ok;
            if (whatsappSuccess) {
                console.log("=== RESEND WHATSAPP SUCCESS ===");
                const sentMediums = [];
                if (whatsappSuccess)
                    sentMediums.push("WhatsApp");
                console.log("sentMediums:", sentMediums);
                return res.json({
                    success: true,
                    message: `Declaration sent via ${sentMediums.join(" and ")}`,
                    mediums: sentMediums,
                    whatsappStatus: whatsappSuccess ? "sent" : "failed",
                });
            }
            else {
                console.error("=== RESEND WHATSAPP FAILED ===");
                return res.status(500).json({
                    error: "Failed to send declaration via  WhatsApp",
                });
            }
        }
    }
    catch (error) {
        console.error("=== FATAL ERROR IN GENERATE DECLARATION ===");
        console.error("Error generating declaration:", error);
        console.error("Stack trace:", error.stack);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = router;


import express from "express";

import { prisma } from "../../../config/prisma";


const router = express.Router();

router.post("/create-manual-diagnostics", async (req, res) => {
    try {
        const { 
            diagnoseId, 
            employeeId, 
            smc, 
            variant, 
            imei1, 
            imei2, 
            screenTouch, 
            screenSpot, 
            screenLines, 
            screenPhysical,
            screenDiscolor,
            screenBubble,
            frontCamera,
            backCamera,
            audioJack,
            wifi,
            gps,
            bluetooth,
            volumeButton,
            flashLight,
            fcImageBlurred,
            bcImageBlurred,
            vibrator,
            battery,
            speaker,
            microphone,
            fingerprint,
            proximity,
            chargingPort,
            powerButton,
            faceLock,
            copyScreen,
            sim,
            physicalScratch,
            physicalDent,
            physicalPanel,
            physicalBent
        } = req.body;

        // Basic required field validations
        if (!diagnoseId || !smc || !variant) {
            return res.status(400).json({ 
                error: "diagnoseId, smc, and variant are required fields" 
            });
        }

        // Validate diagnoseId format (should be string)
        if (typeof diagnoseId !== 'string' || diagnoseId.trim().length === 0) {
            return res.status(400).json({ 
                error: "diagnoseId must be a non-empty string" 
            });
        }

        // Validate smc and variant
        if (typeof smc !== 'string' || smc.trim().length === 0) {
            return res.status(400).json({ 
                error: "smc must be a non-empty string" 
            });
        }

        if (typeof variant !== 'string' || variant.trim().length === 0) {
            return res.status(400).json({ 
                error: "variant must be a non-empty string" 
            });
        }

        // Validate employeeId if provided
        if (employeeId && (typeof employeeId !== 'string' || employeeId.trim().length === 0)) {
            return res.status(400).json({ 
                error: "employeeId must be a non-empty string if provided" 
            });
        }

        // Validate IMEI fields if provided (should be 15 digits)
        if (imei1 && (typeof imei1 !== 'string' || !/^\d{15}$/.test(imei1))) {
            return res.status(400).json({ 
                error: "imei1 must be a 15-digit string if provided" 
            });
        }

        if (imei2 && (typeof imei2 !== 'string' || !/^\d{15}$/.test(imei2))) {
            return res.status(400).json({ 
                error: "imei2 must be a 15-digit string if provided" 
            });
        }

        // Validate all diagnostic result fields (should be strings if provided)
        const diagnosticFields = [
            'screenTouch', 'screenSpot', 'screenLines', 'screenPhysical', 'screenDiscolor', 'screenBubble',
            'frontCamera', 'backCamera', 'audioJack', 'wifi', 'gps', 'bluetooth', 'volumeButton',
            'flashLight', 'fcImageBlurred', 'bcImageBlurred', 'vibrator', 'battery', 'speaker',
            'microphone', 'fingerprint', 'proximity', 'chargingPort', 'powerButton', 'faceLock',
            'copyScreen', 'sim', 'physicalScratch', 'physicalDent', 'physicalPanel', 'physicalBent'
        ];

        for (const field of diagnosticFields) {
            const value = req.body[field];
            if (value !== undefined && (typeof value !== 'string' || value.trim().length === 0)) {
                return res.status(400).json({ 
                    error: `${field} must be a non-empty string if provided` 
                });
            }
        }

        // Check if diagnoseId already exists
        const existingDiagnose = await prisma.manualDiagnosticsResult.findUnique({
            where: { diagnoseId: diagnoseId.trim() }
        });

        if (existingDiagnose) {
            return res.status(409).json({ 
                error: "A diagnostic result with this diagnoseId already exists" 
            });
        }

        // Create the manual diagnostics result
        const diagnosticsResult = await prisma.manualDiagnosticsResult.create({
            data: {
                // id: diagnoseId.trim(),
                diagnoseId: diagnoseId.trim(),
                employeeId: employeeId?.trim() || null,
                smc: smc.trim(),
                variant: variant.trim(),
                imei1: imei1?.trim() || null,
                imei2: imei2?.trim() || null,
                screenTouch: screenTouch?.trim() || "",
                screenSpot: screenSpot?.trim() || "",
                screenLines: screenLines?.trim() || "",
                screenPhysical: screenPhysical?.trim() || "",
                screenDiscolor: screenDiscolor?.trim() || "",
                screenBubble: screenBubble?.trim() || "",
                frontCamera: frontCamera?.trim() || "",
                backCamera: backCamera?.trim() || "",
                audioJack: audioJack?.trim() || "",
                wifi: wifi?.trim() || "",
                gps: gps?.trim() || "",
                bluetooth: bluetooth?.trim() || "",
                volumeButton: volumeButton?.trim() || "",
                flashLight: flashLight?.trim() || "",
                fcImageBlurred: fcImageBlurred?.trim() || "",
                bcImageBlurred: bcImageBlurred?.trim() || "",
                vibrator: vibrator?.trim() || "",
                battery: battery?.trim() || "",
                speaker: speaker?.trim() || "",
                microphone: microphone?.trim() || "",
                fingerprint: fingerprint?.trim() || "",
                proximity: proximity?.trim() || "",
                chargingPort: chargingPort?.trim() || "",
                powerButton: powerButton?.trim() || "",
                faceLock: faceLock?.trim() || "",
                copyScreen: copyScreen?.trim() || "",
                sim: sim?.trim() || "",
                physicalScratch: physicalScratch?.trim() || "",
                physicalDent: physicalDent?.trim() || "",
                physicalPanel: physicalPanel?.trim() || "",
                physicalBent: physicalBent?.trim() || "",
                updatedAt: new Date()
            }
        });

        return res.status(201).json({
            success: true,
            message: "Diagnostic result created successfully",
            data: diagnosticsResult
        });

    } catch (error) {
        console.error("Error creating diagnostics:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
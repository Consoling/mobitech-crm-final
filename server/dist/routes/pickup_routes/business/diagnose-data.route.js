"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../../../config/prisma");
const router = express_1.default.Router();
router.post(`/get-mobitech-data`, async (req, res) => {
    try {
        const { testId } = req.body;
        if (!testId) {
            return res.status(400).json({
                success: false,
                message: "Test ID is required.",
            });
        }
        const diagnosticsData = await prisma_1.prisma.diagnosticsData.findUnique({
            where: {
                testId
            }
        });
        if (!diagnosticsData) {
            return res.status(404).json({
                success: false,
                message: "No data found for the provided Test ID.",
            });
        }
        const cleanedData = {
            ram: diagnosticsData.deviceInfo?.ram ?? null,
            rom: diagnosticsData.deviceInfo?.rom ?? null,
            modelName: diagnosticsData.deviceInfo?.model ?? null,
            imei1: diagnosticsData.imei1,
            imei2: diagnosticsData.imei2,
            testId: diagnosticsData.testId,
            bluetooth: diagnosticsData.bluetoothTest?.status ?? null,
            gps: diagnosticsData.gpsTest?.status ?? null,
            wifi: diagnosticsData.wifiTest?.status ?? null,
            proximity: diagnosticsData.proximityTest?.status ?? null,
            multiTouch: diagnosticsData.screenTest?.multiTouchPassed ?? null,
            screenCalibration: diagnosticsData.screenTest?.status ?? null,
            speaker: diagnosticsData.speakerTest?.status ?? null,
            earReceiver: diagnosticsData.earpieceTest?.status ?? null,
            microphone: diagnosticsData.microphoneTest?.status ?? null,
            frontCamera: diagnosticsData.cameraTest?.frontCameraStatus ?? null,
            backCamera: diagnosticsData.cameraTest?.backCameraStatus ?? null,
            sim: diagnosticsData.isSimCarWorking ? "Working" : "Not Working",
            fingerprint: diagnosticsData.fingerprintTest?.status ?? null,
            chargingPort: diagnosticsData.usbPortTest?.status ?? null,
            volumeButtons: diagnosticsData.volumeKeysTest?.status ?? null,
            powerButton: diagnosticsData.powerButtonTest?.status ?? null,
            screenDiscoloration: diagnosticsData.screenDiscolorationTest?.status ?? null,
            vibration: diagnosticsData.vibrationTest?.status ?? null,
            audioJack: diagnosticsData.audioJackTest?.status ?? null,
        };
        res.status(200).json({
            success: true,
            message: "Mobitech data fetched successfully.",
            data: cleanedData,
        });
    }
    catch (error) {
        console.error("Error fetching Mobitech data:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching Mobitech data.",
        });
    }
});
router.patch(`/update-mobitech-data`, async (req, res) => {
    try {
        const { testId, sets } = req.body;
        if (!testId) {
            return res.status(400).json({
                success: false,
                message: "Test ID is required.",
            });
        }
        if (!sets || !Array.isArray(sets) || sets.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No data updated.",
            });
        }
        const diagnosticsData = await prisma_1.prisma.diagnosticsData.findUnique({
            where: {
                testId
            }
        });
        if (!diagnosticsData) {
            return res.status(404).json({
                success: false,
                message: "Diagnostics data not found.",
            });
        }
        const updatedData = {};
        const updatedJsonFields = {};
        const diagnosticUpdates = {
            bluetooth: { field: "bluetoothTest", property: "status" },
            gps: { field: "gpsTest", property: "status" },
            wifi: { field: "wifiTest", property: "status" },
            proximity: { field: "proximityTest", property: "status" },
            multiTouch: { field: "screenTest", property: "multiTouchPassed" },
            screenCalibration: { field: "screenTest", property: "status" },
            speaker: { field: "speakerTest", property: "status" },
            earReceiver: { field: "earpieceTest", property: "status" },
            microphone: { field: "microphoneTest", property: "status" },
            frontCamera: { field: "cameraTest", property: "frontCameraStatus" },
            backCamera: { field: "cameraTest", property: "backCameraStatus" },
            fingerprint: { field: "fingerprintTest", property: "status" },
            chargingPort: { field: "usbPortTest", property: "status" },
            volumeButtons: { field: "volumeKeysTest", property: "status" },
            powerButton: { field: "powerButtonTest", property: "status" },
            screenDiscoloration: {
                field: "screenDiscolorationTest",
                property: "status",
            },
            vibration: { field: "vibrationTest", property: "status" },
            audioJack: { field: "audioJackTest", property: "status" },
        };
        for (const set of sets) {
            if (!set || typeof set !== "object") {
                continue;
            }
            const { key, value } = set;
            if (key === "isSimCarWorking") {
                if (typeof value === "boolean") {
                    updatedData.isSimCarWorking = value;
                }
                continue;
            }
            const update = diagnosticUpdates[key];
            if (!update || typeof value !== "string") {
                continue;
            }
            if (!updatedJsonFields[update.field]) {
                const currentValue = diagnosticsData[update.field];
                updatedJsonFields[update.field] =
                    currentValue && typeof currentValue === "object" && !Array.isArray(currentValue)
                        ? { ...currentValue }
                        : {};
            }
            updatedJsonFields[update.field][update.property] = value;
        }
        Object.assign(updatedData, updatedJsonFields);
        if (Object.keys(updatedData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid data updated.",
            });
        }
        const updatedDiagnosticsData = await prisma_1.prisma.diagnosticsData.update({
            where: { testId },
            data: updatedData,
        });
        return res.status(200).json({
            success: true,
            message: "Mobitech data updated successfully.",
            data: updatedDiagnosticsData,
        });
    }
    catch (error) {
        console.error("Error updating Mobitech data:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while updating Mobitech data.",
        });
    }
});
exports.default = router;

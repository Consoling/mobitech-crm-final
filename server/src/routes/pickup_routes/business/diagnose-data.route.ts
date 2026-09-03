import express, { Request, Response } from "express";
import { prisma } from "../../../config/prisma";
import { redisClient } from "../../../config/redis";
import {
  authenticate,
  AuthRequest,
} from "../../../middlewares/pickupauth.middleware";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { s3 } from "../../pickup_app_routes/final-upload/pre-signed-url.route";
import { SYS_ENV } from "../../../utils/env";


const router = express.Router();

router.post(`/get-mobitech-data`,  async(req: Request, res: Response) => {
  try {

    const {testId} = req.body

    if(!testId){
      return res.status(400).json({
        success: false,
        message: "Test ID is required.",
      });
    }

    const diagnosticsData = await prisma.diagnosticsData.findUnique({
      where:{
        testId
      }
    })

    if(!diagnosticsData){
      return res.status(404).json({
        success: false,
        message: "No data found for the provided Test ID.",
      });
    }

    const cleanedData = {
      ram: (diagnosticsData.deviceInfo as { ram?: unknown } | null)?.ram ?? null,
      rom: (diagnosticsData.deviceInfo as { rom?: unknown } | null)?.rom ?? null,
      modelName: (diagnosticsData.deviceInfo as { model?: unknown } | null)?.model ?? null,
      imei1: diagnosticsData.imei1,
      imei2: diagnosticsData.imei2,
      testId: diagnosticsData.testId,
      bluetooth: (diagnosticsData.bluetoothTest as { status?: unknown } | null)?.status ?? null,
      gps: (diagnosticsData.gpsTest as { status?: unknown } | null)?.status ?? null,
      wifi: (diagnosticsData.wifiTest as { status?: unknown } | null)?.status ?? null,
      proximity: (diagnosticsData.proximityTest as { status?: unknown } | null)?.status ?? null,
      multiTouch: (diagnosticsData.screenTest as { multiTouchPassed?: unknown } | null)?.multiTouchPassed ?? null,
      screenCalibration: (diagnosticsData.screenTest as { status?: unknown } | null)?.status ?? null,
      speaker: (diagnosticsData.speakerTest as { status?: unknown } | null)?.status ?? null,
      earReceiver: (diagnosticsData.earpieceTest as { status?: unknown } | null)?.status ?? null,
      microphone: (diagnosticsData.microphoneTest as { status?: unknown } | null)?.status ?? null,
      frontCamera: (diagnosticsData.cameraTest as { frontCameraStatus?: unknown } | null)?.frontCameraStatus ?? null,
      backCamera: (diagnosticsData.cameraTest as { backCameraStatus?: unknown } | null)?.backCameraStatus ?? null,
      sim: diagnosticsData.isSimCarWorking ? "Working" : "Not Working",
      fingerprint: (diagnosticsData.fingerprintTest as { status?: unknown } | null)?.status ?? null,
      chargingPort: (diagnosticsData.usbPortTest as { status?: unknown } | null)?.status ?? null,
      volumeButtons: (diagnosticsData.volumeKeysTest as { status?: unknown } | null)?.status ?? null,
      powerButton: (diagnosticsData.powerButtonTest as { status?: unknown } | null)?.status ?? null,
      screenDiscoloration: (diagnosticsData.screenDiscolorationTest as { status?: unknown } | null)?.status ?? null,
      vibration: (diagnosticsData.vibrationTest as { status?: unknown } | null)?.status ?? null,
      audioJack: (diagnosticsData.audioJackTest as { status?: unknown } | null)?.status ?? null,
    }

    res.status(200).json({
      success: true,
      message: "Mobitech data fetched successfully.",
      data: cleanedData,
    });
    
  } catch (error) {
    console.error("Error fetching Mobitech data:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching Mobitech data.",
    });
  }
})



router.patch(`/update-mobitech-data`,  async(req: Request, res: Response) => {
  try {
     const {testId, sets} = req.body

    if(!testId){
      return res.status(400).json({
        success: false,
        message: "Test ID is required.",
      });
    }


    if(!sets || !Array.isArray(sets) || sets.length === 0){
      return res.status(400).json({
        success: false,
        message: "No data updated.",
      });
    }

    const diagnosticsData = await prisma.diagnosticsData.findUnique({
      where:{
        testId
      }
    })

    if(!diagnosticsData){
      return res.status(404).json({
        success: false,
        message: "Diagnostics data not found.",
      });
    }

    const updatedData: Record<string, unknown> = {};
    const updatedJsonFields: Record<string, Record<string, unknown>> = {};

    const diagnosticUpdates: Record<
      string,
      { field: keyof typeof diagnosticsData; property: string }
    > = {
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
            ? { ...(currentValue as Record<string, unknown>) }
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

    const updatedDiagnosticsData = await prisma.diagnosticsData.update({
      where: { testId },
      data: updatedData,
    });

    return res.status(200).json({
      success: true,
      message: "Mobitech data updated successfully.",
      data: updatedDiagnosticsData,
    });

  } catch (error) {
    console.error("Error updating Mobitech data:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating Mobitech data.",
    });
  }
})


export default router
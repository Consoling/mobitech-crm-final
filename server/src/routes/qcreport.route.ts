import express, { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { normalizeDeviceInfo } from "../utils/filterdeviceINfo";

interface DeviceInfo {
  brand: string;
  model: string;
  ram: string;
  rom: string;
}
interface DeviceInfoNew {
  brand: string;
  model: string;
  ram: string;
  storage: string;
}

interface TestResult {
  status?: string;
  [key: string]: any;
}

const router = express.Router();

// Helper function to normalize test status values
const normalizeStatus = (status: any): boolean => {
  if (status === null || status === undefined) return false;
  
  // Handle boolean true as passed
  if (status === true) return true;
  if (status === false) return false;
  
  // Handle string values (case-insensitive)
  if (typeof status === "string") {
    const normalized = status.toLowerCase();
    if (normalized.includes("pass")) return true;
    if (normalized.includes("skip")) return true;
  }
  
  return false;
};

router.post(`/get-qc-reports`, async (req: Request, res: Response) => {
  try {
    const {
      userId,
      page = 1,
      limit = 10,
      search = "",
      timeRange = "",
      status = [],
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required",
      });
    }

    const foundUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!foundUser)
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    if (foundUser.isAdmin === false) {
      return res.status(403).json({
        success: false,
        error: "Access denied. Admins only.",
      });
    }

    // Pagination calculation
    const pageNumber = parseInt(page as string) || 1;
    const pageSize = parseInt(limit as string) || 10;
    const skip = (pageNumber - 1) * pageSize;

    // Build time range filter
    let dateFilter: any = {};
    if (timeRange && timeRange !== "all") {
      const now = new Date();
      let startDate: Date;

      switch (timeRange) {
        case "1month":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            now.getDate(),
          );
          break;
        case "3months":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth() - 3,
            now.getDate(),
          );
          break;
        case "1year":
          startDate = new Date(
            now.getFullYear() - 1,
            now.getMonth(),
            now.getDate(),
          );
          break;
        default:
          startDate = new Date(0); // Beginning of time
      }

      dateFilter = {
        createdAt: {
          gte: startDate,
          lte: now,
        },
      };
    }

    // Build search filter using OR conditions for multiple fields
    const searchFilter = search
      ? {
          OR: [
            { testId: { contains: search, mode: "insensitive" as const } },
            { imei1: { contains: search, mode: "insensitive" as const } },
            { imei2: { contains: search, mode: "insensitive" as const } },
            { employeeId: { contains: search, mode: "insensitive" as const } },
            {
              employeeName: { contains: search, mode: "insensitive" as const },
            },
            // Search in deviceInfo JSON field (brand and model)
            {
              deviceInfo: {
                path: ["brand"],
                string_contains: search,
              },
            },
            {
              deviceInfo: {
                path: ["model"],
                string_contains: search,
              },
            },
          ],
        }
      : {};

    // Combine all filters
    const whereFilter = {
      ...searchFilter,
      ...dateFilter,
    };

    // Fetch all reports to calculate status (will be filtered after fetching)
    // Note: For status filter, we need to check the metadata after fetching
    const allReportsForCount = await prisma.diagnosticsData.findMany({
      where: whereFilter,
      select: {
        id: true,
        screenDiscolorationTest: true,
        screenTest: true,
        gpsTest: true,
        wifiTest: true,
        bluetoothTest: true,
        cameraTest: true,
        powerButtonTest: true,
        volumeKeysTest: true,
        proximityTest: true,
        earpieceTest: true,
        speakerTest: true,
        microphoneTest: true,
        fingerprintTest: true,
        vibrationTest: true,
        usbPortTest: true,
        audioJackTest: true,
        isSimCarWorking: true,
        financeStatus: true,
      },
    });

    // Filter by status if provided
    let filteredIds: string[] = [];
    if (status && Array.isArray(status) && status.length > 0) {
      filteredIds = allReportsForCount
        .filter((report) => {
          const testResults = [
            normalizeStatus((report.screenDiscolorationTest as TestResult | null)?.status),
            normalizeStatus((report.screenTest as TestResult | null)?.status),
            normalizeStatus((report.screenTest as any)?.multiTouchPassed),
            normalizeStatus((report.gpsTest as TestResult | null)?.status),
            normalizeStatus((report.wifiTest as TestResult | null)?.status),
            normalizeStatus((report.bluetoothTest as TestResult | null)?.status),
            normalizeStatus((report.cameraTest as any)?.frontCameraStatus),
            normalizeStatus((report.cameraTest as any)?.backCameraStatus),
            normalizeStatus((report.powerButtonTest as TestResult | null)?.status),
            normalizeStatus((report.volumeKeysTest as TestResult | null)?.status),
            normalizeStatus((report.proximityTest as TestResult | null)?.status),
            normalizeStatus((report.earpieceTest as TestResult | null)?.status),
            normalizeStatus((report.speakerTest as TestResult | null)?.status),
            normalizeStatus((report.microphoneTest as TestResult | null)?.status),
            normalizeStatus((report.fingerprintTest as TestResult | null)?.status),
            normalizeStatus((report.vibrationTest as TestResult | null)?.status),
            normalizeStatus((report.usbPortTest as TestResult | null)?.status),
            normalizeStatus((report.audioJackTest as TestResult | null)?.status),
            normalizeStatus(report.isSimCarWorking),
            normalizeStatus(!report.financeStatus),
          ];

          const failedCount = testResults.filter((test) => !test).length;
          const isPassed = failedCount === 0;

          if (status.includes("passed") && status.includes("failed")) {
            return true; // Both selected, include all
          } else if (status.includes("passed")) {
            return isPassed;
          } else if (status.includes("failed")) {
            return !isPassed;
          }
          return true;
        })
        .map((r) => r.id);
    }

    // Apply status filter to where clause if applicable
    const finalWhereFilter =
      status &&
      Array.isArray(status) &&
      status.length > 0 &&
      filteredIds.length > 0
        ? { ...whereFilter, id: { in: filteredIds } }
        : whereFilter;

    // Get total count with all filters
    const totalCount = await prisma.diagnosticsData.count({
      where: finalWhereFilter,
    });

    const qcReports = await prisma.diagnosticsData.findMany({
      where: finalWhereFilter,
      skip: skip,
      take: pageSize,
      orderBy: {
        createdAt: "desc",
      },
    });

    const qcReportCleaned = qcReports.map((report) => {
      
      const deviceInfo = report.deviceInfo as unknown as DeviceInfoNew;

      // Categorize test results
      const testResults = {
        passed: [] as string[],
        failed: [] as string[],
      };

      // Map test results from diagnosticsData
      const singleTests = [
        {
          name: "Screen Discoloration",
          test: normalizeStatus((report.screenDiscolorationTest as TestResult | null)?.status),
        },
        {
          name: "Screen Calibration",
          test: normalizeStatus((report.screenTest as TestResult | null)?.status),
        },
        {
          name: "Multi Touch",
          test: normalizeStatus((report.screenTest as any)?.multiTouchPassed),
        },
        {
          name: "GPS",
          test: normalizeStatus((report.gpsTest as TestResult | null)?.status),
        },
        {
          name: "WiFi",
          test: normalizeStatus((report.wifiTest as TestResult | null)?.status),
        },
        {
          name: "Bluetooth",
          test: normalizeStatus((report.bluetoothTest as TestResult | null)?.status),
        },
        {
          name: "Front Camera",
          test: normalizeStatus((report.cameraTest as any)?.frontCameraStatus),
        },
        {
          name: "Back Camera",
          test: normalizeStatus((report.cameraTest as any)?.backCameraStatus),
        },
        {
          name: "Power Button",
          test: normalizeStatus((report.powerButtonTest as TestResult | null)?.status),
        },
        {
          name: "Volume Keys",
          test: normalizeStatus((report.volumeKeysTest as TestResult | null)?.status),
        },
        {
          name: "Proximity Sensor",
          test: normalizeStatus((report.proximityTest as TestResult | null)?.status),
        },
        {
          name: "Earpiece",
          test: normalizeStatus((report.earpieceTest as TestResult | null)?.status),
        },
        {
          name: "Speaker",
          test: normalizeStatus((report.speakerTest as TestResult | null)?.status),
        },
        {
          name: "Microphone",
          test: normalizeStatus((report.microphoneTest as TestResult | null)?.status),
        },
        {
          name: "Fingerprint",
          test: normalizeStatus((report.fingerprintTest as TestResult | null)?.status),
        },
        {
          name: "Vibration",
          test: normalizeStatus((report.vibrationTest as TestResult | null)?.status),
        },
        {
          name: "Charging Port",
          test: normalizeStatus((report.usbPortTest as TestResult | null)?.status),
        },
        {
          name: "Audio Jack",
          test: normalizeStatus((report.audioJackTest as TestResult | null)?.status),
        },
        {
          name: "SIM Card",
          test: normalizeStatus(report.isSimCarWorking),
        },
        {
          name: "Finance Lock",
          test: normalizeStatus(!report.financeStatus),
        },
      ];

      singleTests.forEach(({ name, test }) => {
        if (test) {
          testResults.passed.push(name);
        } else {
          testResults.failed.push(name);
        }
      });

      return {
        id: report.id,
        model: deviceInfo
          ? `${deviceInfo.brand} ${deviceInfo.model} (${deviceInfo.ram}/${deviceInfo.storage})`
          : "Unknown Device",
        imei1: report.imei1,
        imei2: report.imei2 || null,
        exchangeCode: report.testId,
        performedOn: report.createdAt,
        employeeId: report.employeeId,
        employeeName: report.employeeName,
        dateTime: report.createdAt.toISOString(),
        metadata: {
          passed: {
            count: testResults.passed.length,
            tests: testResults.passed,
          },
          failed: {
            count: testResults.failed.length,
            tests: testResults.failed,
          },
          totalTests: testResults.passed.length + testResults.failed.length,
        },
      };
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / pageSize);

    return res.status(200).json({
      success: true,
      data: qcReportCleaned,

      pagination: {
        currentPage: pageNumber,
        pageSize: pageSize,
        totalCount: totalCount,
        totalPages: totalPages,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching QC reports:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch QC reports",
    });
  }
});

router.post(`/get-qc-report/:reportId`, async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    if (!reportId) {
      return res.status(400).json({
        success: false,
        error: "reportId is required",
      });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required",
      });
    }

    const foundUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!foundUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }
    if (!foundUser.isAdmin) {
      return res.status(403).json({
        success: false,
        error: "Access denied. Admins only.",
      });
    }
    const report = await prisma.diagnosticsData.findUnique({
      where: {
        testId: reportId,
      },
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        error: "QC Report not found",
      });
    }

    // Helper function to convert status to display format
    const convertStatusForDisplay = (status: any): string | boolean | null => {
      if (status === null || status === undefined) return null;
      
      // Handle boolean true as passed
      if (status === true) return true;
      if (status === false) return false;
      
      // Handle string values (case-insensitive)
      if (typeof status === "string") {
        const normalized = status.toLowerCase();
        if (normalized.includes("pass")) return "Passed";
        if (normalized.includes("fail")) return "Failed";
        if (normalized.includes("skip")) return "Skipped";
      }
      
      return status;
    };

    const normalizedDevice = normalizeDeviceInfo(report.deviceInfo);
    const filteredReport = {
      upperLayerData: {
        employeeImage: report.employeeImageKey,
        employeeId: report.employeeId,
        employeeName: report.employeeName,
        createdAt: report.createdAt.toLocaleString(),
        brand: normalizedDevice.brand,
        model: normalizedDevice.model,
        ram: normalizedDevice.ram,
        storage: normalizedDevice.storage,
        imeiVerifiedModel: report.imeiDetectedModel,
        imei1: report.imei1,
        imei2: report.imei2,
        testId: report.testId,
      },
      lowerLayerData: {
        screenDiscolorationTest: convertStatusForDisplay(report.screenDiscolorationTest ? (report.screenDiscolorationTest as TestResult).status : null),
        screenCalibrationTest: convertStatusForDisplay(report.screenTest ? (report.screenTest as TestResult).status : null),
        multiTouchTest: convertStatusForDisplay(report.screenTest ? (report.screenTest as any).multiTouchPassed : null),
        gpsTest: convertStatusForDisplay(report.gpsTest ? (report.gpsTest as TestResult).status : null),
        wifiTest: convertStatusForDisplay(report.wifiTest ? (report.wifiTest as TestResult).status : null),
        bluetoothTest: convertStatusForDisplay(report.bluetoothTest ? (report.bluetoothTest as TestResult).status : null),
        frontCameraTest: convertStatusForDisplay(report.cameraTest ? (report.cameraTest as any).frontCameraStatus : null),
        backCameraTest: convertStatusForDisplay(report.cameraTest ? (report.cameraTest as any).backCameraStatus : null),
        powerButtonTest: convertStatusForDisplay(report.powerButtonTest ? (report.powerButtonTest as TestResult).status : null),
        volumeKeysTest: convertStatusForDisplay(report.volumeKeysTest ? (report.volumeKeysTest as TestResult).status : null),
        proximitySensorTest: convertStatusForDisplay(report.proximityTest ? (report.proximityTest as TestResult).status : null),
        earpieceTest: convertStatusForDisplay(report.earpieceTest ? (report.earpieceTest as TestResult).status : null),
        speakerTest: convertStatusForDisplay(report.speakerTest ? (report.speakerTest as TestResult).status : null),
        microphoneTest: convertStatusForDisplay(report.microphoneTest ? (report.microphoneTest as TestResult).status : null),
        fingerprintTest: convertStatusForDisplay(report.fingerprintTest ? (report.fingerprintTest as TestResult).status : null),
        vibrationTest: convertStatusForDisplay(report.vibrationTest ? (report.vibrationTest as TestResult).status : null),
        chargingPortTest: convertStatusForDisplay(report.usbPortTest ? (report.usbPortTest as TestResult).status : null),
        audioJackTest: convertStatusForDisplay(report.audioJackTest ? (report.audioJackTest as TestResult).status : null),
        simCardTest: convertStatusForDisplay(report.isSimCarWorking),
        financeLockTest: convertStatusForDisplay(!report.financeStatus),
      }
    };

    return res.status(200).json({
      success: true,
      data: filteredReport,
      testCount: Object.keys(filteredReport.lowerLayerData).length,
    });
  } catch (error) {
    console.error("Error fetching QC report:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch QC report",
    });
  }
});

export default router;

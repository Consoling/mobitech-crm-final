import express, { Request, Response } from "express";
import { prisma } from "../config/prisma";

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
            (report.screenDiscolorationTest as TestResult | null)?.status ===
              "Passed",
            (report.screenTest as TestResult | null)?.status === "Passed",
            (report.screenTest as any)?.multiTouchPassed ?? false,
            (report.gpsTest as TestResult | null)?.status === "Passed",
            (report.wifiTest as TestResult | null)?.status === "Passed",
            (report.bluetoothTest as TestResult | null)?.status === "Passed",
            (report.cameraTest as any)?.frontCameraStatus === "Passed",
            (report.cameraTest as any)?.backCameraStatus === "Passed",
            (report.powerButtonTest as TestResult | null)?.status === "Passed",
            (report.volumeKeysTest as TestResult | null)?.status === "Passed",
            (report.proximityTest as TestResult | null)?.status === "Passed",
            (report.earpieceTest as TestResult | null)?.status === "Passed",
            (report.speakerTest as TestResult | null)?.status === "Passed",
            (report.microphoneTest as TestResult | null)?.status === "Passed",
            (report.fingerprintTest as TestResult | null)?.status === "Passed",
            (report.vibrationTest as TestResult | null)?.status === "Passed",
            (report.usbPortTest as TestResult | null)?.status === "Passed",
            (report.audioJackTest as TestResult | null)?.status === "Passed",
            report.isSimCarWorking ?? false,
            !report.financeStatus,
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
          test:
            (report.screenDiscolorationTest as TestResult | null)?.status ===
            "Passed",
        },
        {
          name: "Screen Calibration",
          test: (report.screenTest as TestResult | null)?.status === "Passed",
        },
        {
          name: "Multi Touch",
          test: (report.screenTest as any)?.multiTouchPassed ?? false,
        },
        {
          name: "GPS",
          test: (report.gpsTest as TestResult | null)?.status === "Passed",
        },
        {
          name: "WiFi",
          test: (report.wifiTest as TestResult | null)?.status === "Passed",
        },
        {
          name: "Bluetooth",
          test:
            (report.bluetoothTest as TestResult | null)?.status === "Passed",
        },
        {
          name: "Front Camera",
          test: (report.cameraTest as any)?.frontCameraStatus === "Passed",
        },
        {
          name: "Back Camera",
          test:
            (report.cameraTest as TestResult | null)?.backCameraStatus ===
            "Passed",
        },
        {
          name: "Power Button",
          test:
            (report.powerButtonTest as TestResult | null)?.status === "Passed",
        },
        {
          name: "Volume Keys",
          test:
            (report.volumeKeysTest as TestResult | null)?.status === "Passed",
        },
        {
          name: "Proximity Sensor",
          test:
            (report.proximityTest as TestResult | null)?.status === "Passed",
        },
        {
          name: "Earpiece",
          test: (report.earpieceTest as TestResult | null)?.status === "Passed",
        },
        {
          name: "Speaker",
          test: (report.speakerTest as TestResult | null)?.status === "Passed",
        },
        {
          name: "Microphone",
          test:
            (report.microphoneTest as TestResult | null)?.status === "Passed",
        },
        {
          name: "Fingerprint",
          test:
            (report.fingerprintTest as TestResult | null)?.status === "Passed",
        },
        {
          name: "Vibration",
          test:
            (report.vibrationTest as TestResult | null)?.status === "Passed",
        },
        {
          name: "Charging Port",
          test: (report.usbPortTest as TestResult | null)?.status === "Passed",
        },
        {
          name: "Audio Jack",
          test:
            (report.audioJackTest as TestResult | null)?.status === "Passed",
        },
        { name: "SIM Card", test: report.isSimCarWorking ?? false },
        { name: "Finance Lock", test: !report.financeStatus },
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

    const filteredReport = {
      upperLayerData: {
        employeeImage: report.employeeImageKey,
        employeeId: report.employeeId,
        employeeName: report.employeeName,
        createdAt: report.createdAt.toLocaleString(),
        brand: report.deviceInfo ? (report.deviceInfo as any).brand : null,
        model: report.deviceInfo ? (report.deviceInfo as any).model : null,
        ram: report.deviceInfo ? (report.deviceInfo as any).ram : null,
        storage: report.deviceInfo ? (report.deviceInfo as any).storage : null,
        imeiVerifiedModel: report.imeiDetectedModel,
        imei1: report.imei1,
        imei2: report.imei2,
        testId: report.testId,
      },
      lowerLayerData: {
        screenDiscolorationTest: report.screenDiscolorationTest ? (report.screenDiscolorationTest as TestResult).status : null,
        screenCalibrationTest: report.screenTest ? (report.screenTest as TestResult).status : null,
        multiTouchTest: report.screenTest ? (report.screenTest as any).multiTouchPassed ? "Passed" : "Failed" : null,
        gpsTest: report.gpsTest? (report.gpsTest as TestResult).status : null,
        wifiTest: report.wifiTest ? (report.wifiTest as TestResult).status : null,
        bluetoothTest: report.bluetoothTest ? (report.bluetoothTest as TestResult).status : null,
        frontCameraTest: report.cameraTest ? (report.cameraTest as any).frontCameraStatus : null,
        backCameraTest: report.cameraTest ? (report.cameraTest as any).backCameraStatus : null,
        powerButtonTest: report.powerButtonTest ? (report.powerButtonTest as TestResult).status : null,
        volumeKeysTest: report.volumeKeysTest ? (report.volumeKeysTest as TestResult).status : null,
        proximitySensorTest: report.proximityTest ? (report.proximityTest as TestResult).status : null,
        earpieceTest: report.earpieceTest ? (report.earpieceTest as TestResult).status : null,
        speakerTest: report.speakerTest ? (report.speakerTest as TestResult).status : null,
        microphoneTest: report.microphoneTest ? (report.microphoneTest as TestResult).status : null,
        fingerprintTest: report.fingerprintTest ? (report.fingerprintTest as TestResult).status : null,
        vibrationTest: report.vibrationTest ? (report.vibrationTest as TestResult).status : null,
        chargingPortTest: report.usbPortTest ? (report.usbPortTest as TestResult).status : null,
        audioJackTest: report.audioJackTest ? (report.audioJackTest as TestResult).status : null,
        simCardTest: report.isSimCarWorking !== null ? (report.isSimCarWorking ? "Passed" : "Failed") : null,
        financeLockTest: report.financeStatus !== null ? (!report.financeStatus ? "Passed" : "Failed") : null,
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

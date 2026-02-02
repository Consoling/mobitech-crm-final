"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../config/prisma");
const router = express_1.default.Router();
router.post(`/get-qc-reports`, async (req, res) => {
    try {
        const { userId, page = 1, limit = 10, search = "", timeRange = "", status = [], } = req.body;
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: "userId is required",
            });
        }
        const foundUser = await prisma_1.prisma.user.findUnique({
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
        const pageNumber = parseInt(page) || 1;
        const pageSize = parseInt(limit) || 10;
        const skip = (pageNumber - 1) * pageSize;
        // Build time range filter
        let dateFilter = {};
        if (timeRange && timeRange !== "all") {
            const now = new Date();
            let startDate;
            switch (timeRange) {
                case "1month":
                    startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                    break;
                case "3months":
                    startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                    break;
                case "1year":
                    startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
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
                    { testId: { contains: search, mode: "insensitive" } },
                    { imei1: { contains: search, mode: "insensitive" } },
                    { imei2: { contains: search, mode: "insensitive" } },
                    { employeeId: { contains: search, mode: "insensitive" } },
                    {
                        employeeName: { contains: search, mode: "insensitive" },
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
        const allReportsForCount = await prisma_1.prisma.diagnosticsData.findMany({
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
        let filteredIds = [];
        if (status && Array.isArray(status) && status.length > 0) {
            filteredIds = allReportsForCount
                .filter((report) => {
                const testResults = [
                    report.screenDiscolorationTest?.status ===
                        "Passed",
                    report.screenTest?.status === "Passed",
                    report.screenTest?.multiTouchPassed ?? false,
                    report.gpsTest?.status === "Passed",
                    report.wifiTest?.status === "Passed",
                    report.bluetoothTest?.status === "Passed",
                    report.cameraTest?.frontCameraStatus === "Passed",
                    report.cameraTest?.backCameraStatus === "Passed",
                    report.powerButtonTest?.status === "Passed",
                    report.volumeKeysTest?.status === "Passed",
                    report.proximityTest?.status === "Passed",
                    report.earpieceTest?.status === "Passed",
                    report.speakerTest?.status === "Passed",
                    report.microphoneTest?.status === "Passed",
                    report.fingerprintTest?.status === "Passed",
                    report.vibrationTest?.status === "Passed",
                    report.usbPortTest?.status === "Passed",
                    report.audioJackTest?.status === "Passed",
                    report.isSimCarWorking ?? false,
                    !report.financeStatus,
                ];
                const failedCount = testResults.filter((test) => !test).length;
                const isPassed = failedCount === 0;
                if (status.includes("passed") && status.includes("failed")) {
                    return true; // Both selected, include all
                }
                else if (status.includes("passed")) {
                    return isPassed;
                }
                else if (status.includes("failed")) {
                    return !isPassed;
                }
                return true;
            })
                .map((r) => r.id);
        }
        // Apply status filter to where clause if applicable
        const finalWhereFilter = status &&
            Array.isArray(status) &&
            status.length > 0 &&
            filteredIds.length > 0
            ? { ...whereFilter, id: { in: filteredIds } }
            : whereFilter;
        // Get total count with all filters
        const totalCount = await prisma_1.prisma.diagnosticsData.count({
            where: finalWhereFilter,
        });
        const qcReports = await prisma_1.prisma.diagnosticsData.findMany({
            where: finalWhereFilter,
            skip: skip,
            take: pageSize,
            orderBy: {
                createdAt: "desc",
            },
        });
        const qcReportCleaned = qcReports.map((report) => {
            const deviceInfo = report.deviceInfo;
            // Categorize test results
            const testResults = {
                passed: [],
                failed: [],
            };
            // Map test results from diagnosticsData
            const singleTests = [
                {
                    name: "Screen Discoloration",
                    test: report.screenDiscolorationTest?.status ===
                        "Passed",
                },
                {
                    name: "Screen Calibration",
                    test: report.screenTest?.status === "Passed",
                },
                {
                    name: "Multi Touch",
                    test: report.screenTest?.multiTouchPassed ?? false,
                },
                {
                    name: "GPS",
                    test: report.gpsTest?.status === "Passed",
                },
                {
                    name: "WiFi",
                    test: report.wifiTest?.status === "Passed",
                },
                {
                    name: "Bluetooth",
                    test: report.bluetoothTest?.status === "Passed",
                },
                {
                    name: "Front Camera",
                    test: report.cameraTest?.frontCameraStatus === "Passed",
                },
                {
                    name: "Back Camera",
                    test: report.cameraTest?.backCameraStatus ===
                        "Passed",
                },
                {
                    name: "Power Button",
                    test: report.powerButtonTest?.status === "Passed",
                },
                {
                    name: "Volume Keys",
                    test: report.volumeKeysTest?.status === "Passed",
                },
                {
                    name: "Proximity Sensor",
                    test: report.proximityTest?.status === "Passed",
                },
                {
                    name: "Earpiece",
                    test: report.earpieceTest?.status === "Passed",
                },
                {
                    name: "Speaker",
                    test: report.speakerTest?.status === "Passed",
                },
                {
                    name: "Microphone",
                    test: report.microphoneTest?.status === "Passed",
                },
                {
                    name: "Fingerprint",
                    test: report.fingerprintTest?.status === "Passed",
                },
                {
                    name: "Vibration",
                    test: report.vibrationTest?.status === "Passed",
                },
                {
                    name: "Charging Port",
                    test: report.usbPortTest?.status === "Passed",
                },
                {
                    name: "Audio Jack",
                    test: report.audioJackTest?.status === "Passed",
                },
                { name: "SIM Card", test: report.isSimCarWorking ?? false },
                { name: "Finance Lock", test: !report.financeStatus },
            ];
            singleTests.forEach(({ name, test }) => {
                if (test) {
                    testResults.passed.push(name);
                }
                else {
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
    }
    catch (error) {
        console.error("Error fetching QC reports:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch QC reports",
        });
    }
});
router.post(`/get-qc-report/:reportId`, async (req, res) => {
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
        const foundUser = await prisma_1.prisma.user.findUnique({
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
        const report = await prisma_1.prisma.diagnosticsData.findUnique({
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
                brand: report.deviceInfo ? report.deviceInfo.brand : null,
                model: report.deviceInfo ? report.deviceInfo.model : null,
                ram: report.deviceInfo ? report.deviceInfo.ram : null,
                storage: report.deviceInfo ? report.deviceInfo.storage : null,
                imeiVerifiedModel: report.imeiDetectedModel,
                imei1: report.imei1,
                imei2: report.imei2,
                testId: report.testId,
            },
            lowerLayerData: {
                screenDiscolorationTest: report.screenDiscolorationTest ? report.screenDiscolorationTest.status : null,
                screenCalibrationTest: report.screenTest ? report.screenTest.status : null,
                multiTouchTest: report.screenTest ? report.screenTest.multiTouchPassed ? "Passed" : "Failed" : null,
                gpsTest: report.gpsTest ? report.gpsTest.status : null,
                wifiTest: report.wifiTest ? report.wifiTest.status : null,
                bluetoothTest: report.bluetoothTest ? report.bluetoothTest.status : null,
                frontCameraTest: report.cameraTest ? report.cameraTest.frontCameraStatus : null,
                backCameraTest: report.cameraTest ? report.cameraTest.backCameraStatus : null,
                powerButtonTest: report.powerButtonTest ? report.powerButtonTest.status : null,
                volumeKeysTest: report.volumeKeysTest ? report.volumeKeysTest.status : null,
                proximitySensorTest: report.proximityTest ? report.proximityTest.status : null,
                earpieceTest: report.earpieceTest ? report.earpieceTest.status : null,
                speakerTest: report.speakerTest ? report.speakerTest.status : null,
                microphoneTest: report.microphoneTest ? report.microphoneTest.status : null,
                fingerprintTest: report.fingerprintTest ? report.fingerprintTest.status : null,
                vibrationTest: report.vibrationTest ? report.vibrationTest.status : null,
                chargingPortTest: report.usbPortTest ? report.usbPortTest.status : null,
                audioJackTest: report.audioJackTest ? report.audioJackTest.status : null,
                simCardTest: report.isSimCarWorking !== null ? (report.isSimCarWorking ? "Passed" : "Failed") : null,
                financeLockTest: report.financeStatus !== null ? (!report.financeStatus ? "Passed" : "Failed") : null,
            }
        };
        return res.status(200).json({
            success: true,
            data: filteredReport,
            testCount: Object.keys(filteredReport.lowerLayerData).length,
        });
    }
    catch (error) {
        console.error("Error fetching QC report:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch QC report",
        });
    }
});
exports.default = router;

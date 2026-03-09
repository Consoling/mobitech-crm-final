"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiagnosticsService = void 0;
const prisma_1 = require("../config/prisma");
const diagnostics_validator_1 = require("../utils/diagnostics.validator");
const constants_1 = require("../utils/constants");
class DiagnosticsService {
    /**
     * Check if diagnostics data with given testId already exists
     */
    static async checkDuplicateTestId(testId) {
        const existing = await prisma_1.prisma.diagnosticsData.findUnique({
            where: { testId },
            select: { id: true },
        });
        return !!existing;
    }
    /**
     * Verify that the employee/user exists in the database
     */
    static async verifyEmployeeExists(employeeDbID) {
        if (!employeeDbID)
            return true; // Optional field
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: employeeDbID },
            select: { id: true },
        });
        return !!user;
    }
    /**
     * Create new diagnostics data entry
     */
    static async createDiagnosticsData(data) {
        // Validate input data structure and types
        (0, diagnostics_validator_1.validateDiagnosticsData)(data);
        // Sanitize and normalize the data
        const sanitizedData = (0, diagnostics_validator_1.sanitizeDiagnosticsData)(data);
        // Check for duplicate testId
        const isDuplicate = await this.checkDuplicateTestId(sanitizedData.testId);
        if (isDuplicate) {
            throw new diagnostics_validator_1.ValidationError(`Diagnostics data with testId '${sanitizedData.testId}' already exists`);
        }
        // Verify employee exists if employeeDbID is provided
        if (sanitizedData.employeeDbID) {
            const employeeExists = await this.verifyEmployeeExists(sanitizedData.employeeDbID);
            if (!employeeExists) {
                throw new diagnostics_validator_1.ValidationError(`Employee with ID '${sanitizedData.employeeDbID}' not found`);
            }
        }
        // Create the diagnostics data in a transaction for consistency
        try {
            const diagnosticsData = await prisma_1.prisma.$transaction(async (tx) => {
                const created = await tx.diagnosticsData.create({
                    data: {
                        testId: sanitizedData.testId,
                        employeeId: sanitizedData.employeeId,
                        employeeName: sanitizedData.employeeName,
                        employeeDbID: sanitizedData.employeeDbID,
                        employeeImageKey: sanitizedData.employeeImageKey,
                        imei1: sanitizedData.imei1,
                        imei2: sanitizedData.imei2,
                        imeiDetectedModel: sanitizedData.imeiDetectedModel,
                        financeStatus: sanitizedData.financeStatus,
                        isSimCarWorking: sanitizedData.isSimCarWorking,
                        isFinanceWarningSkipped: sanitizedData.isFinanceWarningSkipped,
                        timestamp: sanitizedData.timestamp,
                        deviceInfo: sanitizedData.deviceInfo,
                        wifiTest: sanitizedData.wifiTest,
                        bluetoothTest: sanitizedData.bluetoothTest,
                        gpsTest: sanitizedData.gpsTest,
                        powerButtonTest: sanitizedData.powerButtonTest,
                        vibrationTest: sanitizedData.vibrationTest,
                        volumeKeysTest: sanitizedData.volumeKeysTest,
                        screenDiscolorationTest: sanitizedData.screenDiscolorationTest,
                        screenTest: sanitizedData.screenTest,
                        earpieceTest: sanitizedData.earpieceTest,
                        speakerTest: sanitizedData.speakerTest,
                        microphoneTest: sanitizedData.microphoneTest,
                        proximityTest: sanitizedData.proximityTest,
                        cameraTest: sanitizedData.cameraTest,
                        fingerprintTest: sanitizedData.fingerprintTest,
                        usbPortTest: sanitizedData.usbPortTest,
                        audioJackTest: sanitizedData.audioJackTest,
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                phone: true,
                                email: true,
                                role: true,
                            },
                        },
                    },
                });
                return created;
            });
            return diagnosticsData;
        }
        catch (error) {
            // Handle specific Prisma errors
            if (error.code === constants_1.PRISMA_ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION) {
                throw new diagnostics_validator_1.ValidationError("A unique constraint violation occurred");
            }
            if (error.code === constants_1.PRISMA_ERROR_CODES.FOREIGN_KEY_CONSTRAINT_VIOLATION) {
                throw new diagnostics_validator_1.ValidationError("A foreign key constraint violation occurred");
            }
            throw error;
        }
    }
    /**
     * Get diagnostics data by testId
     */
    static async getDiagnosticsDataByTestId(testId) {
        const data = await prisma_1.prisma.diagnosticsData.findUnique({
            where: { testId },
            include: {
                user: {
                    select: {
                        id: true,
                        phone: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });
        return data;
    }
    /**
     * Get diagnostics data by employee ID
     */
    static async getDiagnosticsDataByEmployeeId(employeeId) {
        const data = await prisma_1.prisma.diagnosticsData.findMany({
            where: { employeeId },
            include: {
                user: {
                    select: {
                        id: true,
                        phone: true,
                        email: true,
                        role: true,
                    },
                },
            },
            orderBy: { timestamp: "desc" },
        });
        return data;
    }
}
exports.DiagnosticsService = DiagnosticsService;

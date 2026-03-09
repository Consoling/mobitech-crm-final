import { prisma } from "../config/prisma";
import { DiagnosticsDataRequest } from "../types/diagnostics.types";
import {
  ValidationError,
  validateDiagnosticsData,
  sanitizeDiagnosticsData,
} from "../utils/diagnostics.validator";
import { PRISMA_ERROR_CODES } from "../utils/constants";

export class DiagnosticsService {
  /**
   * Check if diagnostics data with given testId already exists
   */
  static async checkDuplicateTestId(testId: string): Promise<boolean> {
    const existing = await prisma.diagnosticsData.findUnique({
      where: { testId },
      select: { id: true },
    });
    return !!existing;
  }

  /**
   * Verify that the employee/user exists in the database
   */
  static async verifyEmployeeExists(employeeDbID: string): Promise<boolean> {
    if (!employeeDbID) return true; // Optional field
    
    const user = await prisma.user.findUnique({
      where: { id: employeeDbID },
      select: { id: true },
    });
    return !!user;
  }

  /**
   * Create new diagnostics data entry
   */
  static async createDiagnosticsData(data: DiagnosticsDataRequest) {
    // Validate input data structure and types
    validateDiagnosticsData(data);

    // Sanitize and normalize the data
    const sanitizedData = sanitizeDiagnosticsData(data);

    // Check for duplicate testId
    const isDuplicate = await this.checkDuplicateTestId(sanitizedData.testId);
    if (isDuplicate) {
      throw new ValidationError(
        `Diagnostics data with testId '${sanitizedData.testId}' already exists`
      );
    }

    // Verify employee exists if employeeDbID is provided
    if (sanitizedData.employeeDbID) {
      const employeeExists = await this.verifyEmployeeExists(sanitizedData.employeeDbID);
      if (!employeeExists) {
        throw new ValidationError(
          `Employee with ID '${sanitizedData.employeeDbID}' not found`
        );
      }
    }

    // Create the diagnostics data in a transaction for consistency
    try {
      const diagnosticsData = await prisma.$transaction(async (tx) => {
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
    } catch (error: any) {
      // Handle specific Prisma errors
      if (error.code === PRISMA_ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION) {
        throw new ValidationError("A unique constraint violation occurred");
      }
      if (error.code === PRISMA_ERROR_CODES.FOREIGN_KEY_CONSTRAINT_VIOLATION) {
        throw new ValidationError("A foreign key constraint violation occurred");
      }
      throw error;
    }
  }

  /**
   * Get diagnostics data by testId
   */
  static async getDiagnosticsDataByTestId(testId: string) {
    const data = await prisma.diagnosticsData.findUnique({
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
  static async getDiagnosticsDataByEmployeeId(employeeId: string) {
    const data = await prisma.diagnosticsData.findMany({
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

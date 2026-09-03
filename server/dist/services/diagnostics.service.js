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
    /**
     * Normalize any string or boolean value into a pure boolean
     */
    static normalizeToBoolean(value) {
        if (value === null || value === undefined)
            return false;
        if (typeof value === "boolean")
            return value;
        if (typeof value === "number")
            return value !== 0;
        if (typeof value === "object") {
            if (value.status !== undefined)
                return this.normalizeToBoolean(value.status);
        }
        if (typeof value === "string") {
            const lower = value.toLowerCase().trim();
            if ([
                "true",
                "pass",
                "working",
                "1",
                "yes",
                "ok",
                "success",
                "both sim are working",
                "single sim working",
            ].includes(lower)) {
                return true;
            }
            return false;
        }
        return false;
    }
    /**
     * Parse variant string (e.g., "8GB/128GB", "8 GB / 128 GB") into RAM and ROM
     */
    static parseVariantRamRom(variant) {
        if (!variant || typeof variant !== "string") {
            return { ram: "", rom: "" };
        }
        const str = variant.trim();
        const parts = str.split(/[/+]/);
        if (parts.length >= 2) {
            return {
                ram: parts[0].trim(),
                rom: parts[1].trim(),
            };
        }
        return { ram: str, rom: "" };
    }
    /**
     * Format Mobitech DiagnosticsData into requirement standard format
     */
    static formatMobitechDiagnostics(record) {
        const deviceInfo = record.deviceInfo || {};
        const cameraTest = record.cameraTest || {};
        const screenTest = record.screenTest || {};
        const frontCameraVal = cameraTest.frontCamera !== undefined
            ? cameraTest.frontCamera
            : cameraTest.frontCameraStatus !== undefined
                ? cameraTest.frontCameraStatus
                : cameraTest.status;
        const backCameraVal = cameraTest.backCamera !== undefined
            ? cameraTest.backCamera
            : cameraTest.backCameraStatus !== undefined
                ? cameraTest.backCameraStatus
                : cameraTest.status;
        const audioJackVal = record.audioJackTest?.status !== undefined
            ? record.audioJackTest.status
            : record.audioJackTest;
        return {
            diagnoseType: "mobitech",
            mtype: "mbdg",
            testId: record.testId || "",
            imei1: record.imei1 || "",
            imei2: record.imei2 || "",
            modelName: deviceInfo.model || record.imeiDetectedModel || "",
            ram: deviceInfo.ram || "",
            rom: deviceInfo.storage || deviceInfo.rom || "",
            bluetooth: this.normalizeToBoolean(record.bluetoothTest?.status ?? record.bluetoothTest),
            gps: this.normalizeToBoolean(record.gpsTest?.status ?? record.gpsTest),
            wifi: this.normalizeToBoolean(record.wifiTest?.status ?? record.wifiTest),
            proximity: this.normalizeToBoolean(record.proximityTest?.status ?? record.proximityTest),
            multiTouch: this.normalizeToBoolean(screenTest.multiTouchPassed !== undefined
                ? screenTest.multiTouchPassed
                : screenTest.status),
            screenCalibration: this.normalizeToBoolean(screenTest.status),
            speaker: this.normalizeToBoolean(record.speakerTest?.status ?? record.speakerTest),
            earReceiver: this.normalizeToBoolean(record.earpieceTest?.status ?? record.earpieceTest),
            microphone: this.normalizeToBoolean(record.microphoneTest?.status ?? record.microphoneTest),
            frontCamera: this.normalizeToBoolean(frontCameraVal),
            backCamera: this.normalizeToBoolean(backCameraVal),
            sim: this.normalizeToBoolean(record.isSimCarWorking),
            fingerprint: this.normalizeToBoolean(record.fingerprintTest?.status ?? record.fingerprintTest),
            chargingPort: this.normalizeToBoolean(record.usbPortTest?.status ?? record.usbPortTest),
            audioJack: this.normalizeToBoolean(audioJackVal),
        };
    }
    /**
     * Format Self Diagnostics (manualDiagnosticsResult) into requirement standard format
     */
    static formatSelfDiagnostics(record) {
        const { ram, rom } = this.parseVariantRamRom(record.variant);
        return {
            diagnoseType: "self",
            mtype: "sfdg",
            testId: record.diagnoseId || record.id || "",
            imei1: record.imei1 || "",
            imei2: record.imei2 || "",
            modelName: record.smc || "",
            ram: ram,
            rom: rom,
            bluetooth: record.bluetooth === "Not working"
                ? false
                : record.bluetooth === "Working"
                    ? true
                    : this.normalizeToBoolean(record.bluetooth),
            gps: record.gps === "Not working"
                ? false
                : record.gps === "Working"
                    ? true
                    : this.normalizeToBoolean(record.gps),
            wifi: record.wifi === "Not working"
                ? false
                : record.wifi === "Working"
                    ? true
                    : this.normalizeToBoolean(record.wifi),
            proximity: record.proximity === "Not working"
                ? false
                : record.proximity === "Working"
                    ? true
                    : this.normalizeToBoolean(record.proximity),
            multiTouch: record.screenTouch === "Not working"
                ? false
                : record.screenTouch === "Working"
                    ? true
                    : this.normalizeToBoolean(record.screenTouch),
            screenCalibration: record.screenTouch === "Not working"
                ? false
                : record.screenTouch === "Working"
                    ? true
                    : this.normalizeToBoolean(record.screenTouch),
            speaker: record.speaker === "Not working"
                ? false
                : record.speaker === "Working"
                    ? true
                    : this.normalizeToBoolean(record.speaker),
            earReceiver: record.speaker === "Not working"
                ? false
                : record.speaker === "Working"
                    ? true
                    : this.normalizeToBoolean(record.speaker),
            microphone: record.microphone === "Not working"
                ? false
                : record.microphone === "Working"
                    ? true
                    : this.normalizeToBoolean(record.microphone),
            frontCamera: record.frontCamera === "Not working"
                ? false
                : record.frontCamera === "Working"
                    ? true
                    : this.normalizeToBoolean(record.frontCamera),
            backCamera: record.backCamera === "Not working"
                ? false
                : record.backCamera === "Working"
                    ? true
                    : this.normalizeToBoolean(record.backCamera),
            sim: record.sim === "Not working"
                ? false
                : record.sim === "Working" ||
                    record.sim === "Both SIM are working" ||
                    record.sim === "Single SIM Working"
                    ? true
                    : this.normalizeToBoolean(record.sim),
            fingerprint: record.fingerprint === "Not working"
                ? false
                : record.fingerprint === "Working"
                    ? true
                    : this.normalizeToBoolean(record.fingerprint),
            chargingPort: record.chargingPort === "Not working"
                ? false
                : record.chargingPort === "Working"
                    ? true
                    : this.normalizeToBoolean(record.chargingPort),
            audioJack: record.audioJack === "Not working"
                ? false
                : record.audioJack === "Working"
                    ? true
                    : this.normalizeToBoolean(record.audioJack),
        };
    }
    /**
     * Get formatted diagnostics data by testId (Mobitech Diagnose or Self Diagnose)
     */
    static async getFormattedDiagnosticsByTestId(testId, mtype) {
        const normalizedType = mtype?.toLowerCase().trim();
        if (normalizedType === "sfdg" || normalizedType === "self") {
            const selfDiag = await prisma_1.prisma.manualDiagnosticsResult.findUnique({
                where: { diagnoseId: testId },
            });
            if (!selfDiag)
                return null;
            return this.formatSelfDiagnostics(selfDiag);
        }
        if (normalizedType === "mbdg" || normalizedType === "mobitech") {
            const mobitechDiag = await prisma_1.prisma.diagnosticsData.findUnique({
                where: { testId },
            });
            if (!mobitechDiag)
                return null;
            return this.formatMobitechDiagnostics(mobitechDiag);
        }
        // Default auto-detect: check Mobitech Diagnose first, then fallback to Self Diagnose
        const mobitechDiag = await prisma_1.prisma.diagnosticsData.findUnique({
            where: { testId },
        });
        if (mobitechDiag) {
            console.log(`Found Mobitech diagnostics data for testId: ${testId}`, mobitechDiag);
            return this.formatMobitechDiagnostics(mobitechDiag);
        }
        const selfDiag = await prisma_1.prisma.manualDiagnosticsResult.findUnique({
            where: { diagnoseId: testId },
        });
        if (selfDiag) {
            return this.formatSelfDiagnostics(selfDiag);
        }
        return null;
    }
    /**
     * Update Self Diagnostics (ManualDiagnosticsResult) by testId
     */
    static async updateSelfDiagnosticsDataByTestId(testId, updates) {
        const existing = await prisma_1.prisma.manualDiagnosticsResult.findUnique({
            where: { diagnoseId: testId },
        });
        if (!existing) {
            throw new diagnostics_validator_1.ValidationError(`Self diagnostics data with diagnoseId '${testId}' not found`);
        }
        const toStatusString = (val) => (this.normalizeToBoolean(val) ? "Working" : "Not working");
        const updatedData = {};
        if (updates.imei1 !== undefined)
            updatedData.imei1 = updates.imei1;
        if (updates.imei2 !== undefined)
            updatedData.imei2 = updates.imei2;
        if (updates.modelName !== undefined || updates.smc !== undefined) {
            updatedData.smc = updates.modelName ?? updates.smc;
        }
        if (updates.ram !== undefined || updates.rom !== undefined || updates.variant !== undefined) {
            if (updates.variant !== undefined) {
                updatedData.variant = updates.variant;
            }
            else {
                const { ram: oldRam, rom: oldRom } = this.parseVariantRamRom(existing.variant);
                const newRam = updates.ram !== undefined ? updates.ram : oldRam;
                const newRom = updates.rom !== undefined ? updates.rom : oldRom;
                updatedData.variant = `${newRam}/${newRom}`;
            }
        }
        if (updates.bluetooth !== undefined)
            updatedData.bluetooth = toStatusString(updates.bluetooth);
        if (updates.gps !== undefined)
            updatedData.gps = toStatusString(updates.gps);
        if (updates.wifi !== undefined)
            updatedData.wifi = toStatusString(updates.wifi);
        if (updates.proximity !== undefined)
            updatedData.proximity = toStatusString(updates.proximity);
        if (updates.multiTouch !== undefined || updates.screenCalibration !== undefined) {
            updatedData.screenTouch = toStatusString(updates.multiTouch ?? updates.screenCalibration);
        }
        if (updates.speaker !== undefined)
            updatedData.speaker = toStatusString(updates.speaker);
        if (updates.microphone !== undefined)
            updatedData.microphone = toStatusString(updates.microphone);
        if (updates.frontCamera !== undefined)
            updatedData.frontCamera = toStatusString(updates.frontCamera);
        if (updates.backCamera !== undefined)
            updatedData.backCamera = toStatusString(updates.backCamera);
        if (updates.chargingPort !== undefined)
            updatedData.chargingPort = toStatusString(updates.chargingPort);
        if (updates.fingerprint !== undefined)
            updatedData.fingerprint = toStatusString(updates.fingerprint);
        if (updates.audioJack !== undefined)
            updatedData.audioJack = toStatusString(updates.audioJack);
        if (updates.sim !== undefined) {
            updatedData.sim = typeof updates.sim === "string" ? updates.sim : (this.normalizeToBoolean(updates.sim) ? "Both SIM are working" : "Not working");
        }
        const result = await prisma_1.prisma.manualDiagnosticsResult.update({
            where: { diagnoseId: testId },
            data: updatedData,
        });
        return this.formatSelfDiagnostics(result);
    }
    /**
     * Update diagnostics data by testId for Mobitech Diagnose or Self Diagnose
     */
    static async updateDiagnosticsDataByTestId(testId, updates, mtype) {
        const normalizedType = mtype?.toLowerCase().trim() || updates.mtype?.toLowerCase().trim() || updates.type?.toLowerCase().trim();
        if (normalizedType === "sfdg" || normalizedType === "self") {
            return this.updateSelfDiagnosticsDataByTestId(testId, updates);
        }
        if (normalizedType === "mbdg" || normalizedType === "mobitech") {
            return this.updateMobitechDiagnosticsDataByTestId(testId, updates);
        }
        // Auto-detect: check Mobitech Diagnose first, then fallback to Self Diagnose
        const existingMobitech = await prisma_1.prisma.diagnosticsData.findUnique({
            where: { testId },
            select: { id: true },
        });
        if (existingMobitech) {
            return this.updateMobitechDiagnosticsDataByTestId(testId, updates);
        }
        const existingSelf = await prisma_1.prisma.manualDiagnosticsResult.findUnique({
            where: { diagnoseId: testId },
            select: { id: true },
        });
        if (existingSelf) {
            return this.updateSelfDiagnosticsDataByTestId(testId, updates);
        }
        throw new diagnostics_validator_1.ValidationError(`Diagnostic record with testId/diagnoseId '${testId}' not found`);
    }
    /**
     * Internal implementation for updating Mobitech DiagnosticsData
     */
    static async updateMobitechDiagnosticsDataByTestId(testId, updates) {
        const existing = await prisma_1.prisma.diagnosticsData.findUnique({
            where: { testId },
        });
        if (!existing) {
            throw new diagnostics_validator_1.ValidationError(`Mobitech diagnostics data with testId '${testId}' not found`);
        }
        const existingDeviceInfo = existing.deviceInfo || {};
        const existingCameraTest = existing.cameraTest || {};
        const existingScreenTest = existing.screenTest || {};
        const existingWifiTest = existing.wifiTest || {};
        const existingBluetoothTest = existing.bluetoothTest || {};
        const existingGpsTest = existing.gpsTest || {};
        const existingProximityTest = existing.proximityTest || {};
        const existingSpeakerTest = existing.speakerTest || {};
        const existingEarpieceTest = existing.earpieceTest || {};
        const existingMicrophoneTest = existing.microphoneTest || {};
        const existingFingerprintTest = existing.fingerprintTest || {};
        const existingUsbTest = existing.usbPortTest || {};
        const existingAudioJackTest = existing.audioJackTest || {};
        const newDeviceInfo = {
            ...existingDeviceInfo,
            model: updates.modelName !== undefined ? updates.modelName : (updates.deviceInfo?.model ?? existingDeviceInfo.model),
            ram: updates.ram !== undefined ? updates.ram : (updates.deviceInfo?.ram ?? existingDeviceInfo.ram),
            storage: updates.rom !== undefined ? updates.rom : (updates.deviceInfo?.storage ?? existingDeviceInfo.storage),
        };
        const newBluetoothTest = updates.bluetooth !== undefined
            ? { status: this.normalizeToBoolean(updates.bluetooth) }
            : (updates.bluetoothTest !== undefined ? updates.bluetoothTest : existingBluetoothTest);
        const newGpsTest = updates.gps !== undefined
            ? { status: this.normalizeToBoolean(updates.gps) }
            : (updates.gpsTest !== undefined ? updates.gpsTest : existingGpsTest);
        const newWifiTest = updates.wifi !== undefined
            ? { status: this.normalizeToBoolean(updates.wifi) }
            : (updates.wifiTest !== undefined ? updates.wifiTest : existingWifiTest);
        const newProximityTest = updates.proximity !== undefined
            ? { status: this.normalizeToBoolean(updates.proximity) }
            : (updates.proximityTest !== undefined ? updates.proximityTest : existingProximityTest);
        const newSpeakerTest = updates.speaker !== undefined
            ? { status: this.normalizeToBoolean(updates.speaker) }
            : (updates.speakerTest !== undefined ? updates.speakerTest : existingSpeakerTest);
        const newEarpieceTest = updates.earReceiver !== undefined
            ? { status: this.normalizeToBoolean(updates.earReceiver) }
            : (updates.earpieceTest !== undefined ? updates.earpieceTest : existingEarpieceTest);
        const newMicrophoneTest = updates.microphone !== undefined
            ? { status: this.normalizeToBoolean(updates.microphone) }
            : (updates.microphoneTest !== undefined ? updates.microphoneTest : existingMicrophoneTest);
        const newFingerprintTest = updates.fingerprint !== undefined
            ? { status: this.normalizeToBoolean(updates.fingerprint) }
            : (updates.fingerprintTest !== undefined ? updates.fingerprintTest : existingFingerprintTest);
        const newUsbPortTest = updates.chargingPort !== undefined
            ? { status: this.normalizeToBoolean(updates.chargingPort) }
            : (updates.usbPortTest !== undefined ? updates.usbPortTest : existingUsbTest);
        const newAudioJackTest = updates.audioJack !== undefined
            ? { status: this.normalizeToBoolean(updates.audioJack) }
            : (updates.audioJackTest !== undefined ? updates.audioJackTest : existingAudioJackTest);
        const newScreenTest = {
            ...existingScreenTest,
            status: updates.screenCalibration !== undefined
                ? this.normalizeToBoolean(updates.screenCalibration)
                : (updates.screenTest?.status !== undefined ? this.normalizeToBoolean(updates.screenTest.status) : this.normalizeToBoolean(existingScreenTest.status)),
            multiTouchPassed: updates.multiTouch !== undefined
                ? this.normalizeToBoolean(updates.multiTouch)
                : (updates.screenTest?.multiTouchPassed !== undefined ? this.normalizeToBoolean(updates.screenTest.multiTouchPassed) : this.normalizeToBoolean(existingScreenTest.multiTouchPassed)),
        };
        const newCameraTest = {
            ...existingCameraTest,
            frontCamera: updates.frontCamera !== undefined
                ? this.normalizeToBoolean(updates.frontCamera)
                : (updates.cameraTest?.frontCamera !== undefined ? this.normalizeToBoolean(updates.cameraTest.frontCamera) : this.normalizeToBoolean(existingCameraTest.frontCamera)),
            backCamera: updates.backCamera !== undefined
                ? this.normalizeToBoolean(updates.backCamera)
                : (updates.cameraTest?.backCamera !== undefined ? this.normalizeToBoolean(updates.cameraTest.backCamera) : this.normalizeToBoolean(existingCameraTest.backCamera)),
            status: (updates.frontCamera !== undefined || updates.backCamera !== undefined)
                ? (this.normalizeToBoolean(updates.frontCamera ?? existingCameraTest.frontCamera) && this.normalizeToBoolean(updates.backCamera ?? existingCameraTest.backCamera))
                : (updates.cameraTest?.status !== undefined ? this.normalizeToBoolean(updates.cameraTest.status) : this.normalizeToBoolean(existingCameraTest.status)),
        };
        const updatedData = {};
        if (updates.imei1 !== undefined)
            updatedData.imei1 = updates.imei1;
        if (updates.imei2 !== undefined)
            updatedData.imei2 = updates.imei2;
        if (updates.sim !== undefined || updates.isSimCarWorking !== undefined) {
            updatedData.isSimCarWorking = this.normalizeToBoolean(updates.sim ?? updates.isSimCarWorking);
        }
        updatedData.deviceInfo = newDeviceInfo;
        updatedData.bluetoothTest = newBluetoothTest;
        updatedData.gpsTest = newGpsTest;
        updatedData.wifiTest = newWifiTest;
        updatedData.proximityTest = newProximityTest;
        updatedData.speakerTest = newSpeakerTest;
        updatedData.earpieceTest = newEarpieceTest;
        updatedData.microphoneTest = newMicrophoneTest;
        updatedData.fingerprintTest = newFingerprintTest;
        updatedData.usbPortTest = newUsbPortTest;
        updatedData.audioJackTest = newAudioJackTest;
        updatedData.screenTest = newScreenTest;
        updatedData.cameraTest = newCameraTest;
        const result = await prisma_1.prisma.diagnosticsData.update({
            where: { testId },
            data: updatedData,
        });
        return this.formatMobitechDiagnostics(result);
    }
}
exports.DiagnosticsService = DiagnosticsService;

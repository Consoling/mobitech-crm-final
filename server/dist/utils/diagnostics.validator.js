"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeDiagnosticsData = exports.validateDiagnosticsData = exports.validateFingerprintTest = exports.validateCameraTest = exports.validateScreenTest = exports.validateSimpleTestResult = exports.validateDeviceInfo = exports.isValidTimestamp = exports.isValidTestId = exports.isValidIMEI = exports.normalizeBoolean = exports.ValidationError = void 0;
const constants_1 = require("./constants");
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
    }
}
exports.ValidationError = ValidationError;
/**
 * Normalizes boolean values from strings or booleans
 */
const normalizeBoolean = (value) => {
    if (value === null || value === undefined)
        return null;
    if (typeof value === "boolean")
        return value;
    if (typeof value === "string") {
        const lowerValue = value.toLowerCase().trim();
        if (lowerValue === "true")
            return true;
        if (lowerValue === "false")
            return false;
    }
    return null;
};
exports.normalizeBoolean = normalizeBoolean;
/**
 * Validates IMEI format (15 digits)
 */
const isValidIMEI = (imei) => {
    return constants_1.REGEX_PATTERNS.IMEI.test(imei);
};
exports.isValidIMEI = isValidIMEI;
/**
 * Validates test ID format (alphanumeric)
 */
const isValidTestId = (testId) => {
    return constants_1.REGEX_PATTERNS.TEST_ID.test(testId) && testId.length >= constants_1.VALIDATION_CONSTRAINTS.TEST_ID_MIN_LENGTH;
};
exports.isValidTestId = isValidTestId;
/**
 * Validates ISO 8601 timestamp format
 */
const isValidTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return !isNaN(date.getTime());
};
exports.isValidTimestamp = isValidTimestamp;
/**
 * Validates device info structure
 */
const validateDeviceInfo = (deviceInfo) => {
    if (!deviceInfo || typeof deviceInfo !== "object") {
        throw new ValidationError("deviceInfo must be an object");
    }
    if (!deviceInfo.model || typeof deviceInfo.model !== "string") {
        throw new ValidationError("deviceInfo.model is required and must be a string");
    }
    if (typeof deviceInfo.brand !== "string") {
        throw new ValidationError("deviceInfo.brand must be a string");
    }
    if (!deviceInfo.ram || typeof deviceInfo.ram !== "string") {
        throw new ValidationError("deviceInfo.ram is required and must be a string");
    }
    if (!deviceInfo.storage || typeof deviceInfo.storage !== "string") {
        throw new ValidationError("deviceInfo.storage is required and must be a string");
    }
};
exports.validateDeviceInfo = validateDeviceInfo;
/**
 * Validates simple test result structure
 */
const validateSimpleTestResult = (test, testName) => {
    if (!test || typeof test !== "object") {
        throw new ValidationError(`${testName} must be an object`);
    }
    if (typeof test.status !== "boolean") {
        throw new ValidationError(`${testName}.status must be a boolean`);
    }
};
exports.validateSimpleTestResult = validateSimpleTestResult;
/**
 * Validates screen test result structure
 */
const validateScreenTest = (screenTest) => {
    if (!screenTest || typeof screenTest !== "object") {
        throw new ValidationError("screenTest must be an object");
    }
    if (typeof screenTest.status !== "boolean") {
        throw new ValidationError("screenTest.status must be a boolean");
    }
    if (typeof screenTest.multiTouchPassed !== "boolean") {
        throw new ValidationError("screenTest.multiTouchPassed must be a boolean");
    }
    if (typeof screenTest.coveragePercentage !== "number" ||
        screenTest.coveragePercentage < constants_1.VALIDATION_CONSTRAINTS.COVERAGE_MIN ||
        screenTest.coveragePercentage > constants_1.VALIDATION_CONSTRAINTS.COVERAGE_MAX) {
        throw new ValidationError(`screenTest.coveragePercentage must be a number between ${constants_1.VALIDATION_CONSTRAINTS.COVERAGE_MIN} and ${constants_1.VALIDATION_CONSTRAINTS.COVERAGE_MAX}`);
    }
};
exports.validateScreenTest = validateScreenTest;
/**
 * Validates camera test result structure
 */
const validateCameraTest = (cameraTest) => {
    if (!cameraTest || typeof cameraTest !== "object") {
        throw new ValidationError("cameraTest must be an object");
    }
    if (typeof cameraTest.status !== "boolean") {
        throw new ValidationError("cameraTest.status must be a boolean");
    }
    if (typeof cameraTest.frontCameraStatus !== "boolean") {
        throw new ValidationError("cameraTest.frontCameraStatus must be a boolean");
    }
    if (typeof cameraTest.backCameraStatus !== "boolean") {
        throw new ValidationError("cameraTest.backCameraStatus must be a boolean");
    }
};
exports.validateCameraTest = validateCameraTest;
/**
 * Validates fingerprint test result structure
 */
const validateFingerprintTest = (fingerprintTest) => {
    if (!fingerprintTest || typeof fingerprintTest !== "object") {
        throw new ValidationError("fingerprintTest must be an object");
    }
    const status = fingerprintTest.status;
    if (typeof status !== "boolean" &&
        typeof status !== "string") {
        throw new ValidationError("fingerprintTest.status must be a boolean or string");
    }
};
exports.validateFingerprintTest = validateFingerprintTest;
/**
 * Comprehensive validation for diagnostics data request
 */
const validateDiagnosticsData = (data) => {
    // Required string fields
    const requiredStringFields = [
        "testId",
        "employeeId",
        "employeeName",
        "employeeDbID",
        "imei1",
        "imei2",
        "imeiDetectedModel",
    ];
    for (const field of requiredStringFields) {
        if (!data[field] || typeof data[field] !== "string" || data[field].trim() === "") {
            throw new ValidationError(`${field} is required and must be a non-empty string`);
        }
    }
    // Validate testId format
    if (!(0, exports.isValidTestId)(data.testId)) {
        throw new ValidationError("testId must be alphanumeric");
    }
    // Validate IMEIs
    if (!(0, exports.isValidIMEI)(data.imei1)) {
        throw new ValidationError(`imei1 must be a ${constants_1.VALIDATION_CONSTRAINTS.IMEI_LENGTH}-digit number`);
    }
    if (!(0, exports.isValidIMEI)(data.imei2)) {
        throw new ValidationError(`imei2 must be a ${constants_1.VALIDATION_CONSTRAINTS.IMEI_LENGTH}-digit number`);
    }
    // Validate timestamp
    if (!data.timestamp || !(0, exports.isValidTimestamp)(data.timestamp)) {
        throw new ValidationError("timestamp must be a valid ISO 8601 date string");
    }
    // Validate financeStatus
    if (typeof data.financeStatus !== "boolean") {
        throw new ValidationError("financeStatus must be a boolean");
    }
    // Validate device info
    (0, exports.validateDeviceInfo)(data.deviceInfo);
    // Validate all test results
    const simpleTests = [
        "wifiTest",
        "bluetoothTest",
        "gpsTest",
        "powerButtonTest",
        "vibrationTest",
        "volumeKeysTest",
        "screenDiscolorationTest",
        "earpieceTest",
        "speakerTest",
        "microphoneTest",
        "proximityTest",
        "usbPortTest",
        "audioJackTest",
    ];
    for (const testName of simpleTests) {
        if (data[testName]) {
            (0, exports.validateSimpleTestResult)(data[testName], testName);
        }
    }
    // Validate complex test results
    if (data.screenTest) {
        (0, exports.validateScreenTest)(data.screenTest);
    }
    if (data.cameraTest) {
        (0, exports.validateCameraTest)(data.cameraTest);
    }
    if (data.fingerprintTest) {
        (0, exports.validateFingerprintTest)(data.fingerprintTest);
    }
};
exports.validateDiagnosticsData = validateDiagnosticsData;
/**
 * Sanitizes and normalizes the diagnostics data
 */
const sanitizeDiagnosticsData = (data) => {
    return {
        testId: data.testId.trim(),
        employeeId: data.employeeId.trim(),
        employeeName: data.employeeName.trim(),
        employeeDbID: data.employeeDbID.trim(),
        employeeImageKey: data.employeeImageKey?.trim() || "",
        imei1: data.imei1.trim(),
        imei2: data.imei2.trim(),
        imeiDetectedModel: data.imeiDetectedModel.trim(),
        financeStatus: Boolean(data.financeStatus),
        isSimCarWorking: (0, exports.normalizeBoolean)(data.isSimCarWorking),
        isFinanceWarningSkipped: (0, exports.normalizeBoolean)(data.isFinanceWarningSkipped),
        timestamp: new Date(data.timestamp),
        deviceInfo: data.deviceInfo,
        wifiTest: data.wifiTest,
        bluetoothTest: data.bluetoothTest,
        gpsTest: data.gpsTest,
        powerButtonTest: data.powerButtonTest,
        vibrationTest: data.vibrationTest,
        volumeKeysTest: data.volumeKeysTest,
        screenDiscolorationTest: data.screenDiscolorationTest,
        screenTest: data.screenTest,
        earpieceTest: data.earpieceTest,
        speakerTest: data.speakerTest,
        microphoneTest: data.microphoneTest,
        proximityTest: data.proximityTest,
        cameraTest: data.cameraTest,
        fingerprintTest: data.fingerprintTest,
        usbPortTest: data.usbPortTest,
        audioJackTest: data.audioJackTest,
    };
};
exports.sanitizeDiagnosticsData = sanitizeDiagnosticsData;

import { DiagnosticsDataRequest } from "../types/diagnostics.types";
import { REGEX_PATTERNS, VALIDATION_CONSTRAINTS } from "./constants";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Normalizes boolean values from strings or booleans
 */
export const normalizeBoolean = (
  value: string | boolean | null | undefined
): boolean | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lowerValue = value.toLowerCase().trim();
    if (lowerValue === "true") return true;
    if (lowerValue === "false") return false;
  }
  return null;
};

/**
 * Validates IMEI format (15 digits)
 */
export const isValidIMEI = (imei: string): boolean => {
  return REGEX_PATTERNS.IMEI.test(imei);
};

/**
 * Validates test ID format (alphanumeric)
 */
export const isValidTestId = (testId: string): boolean => {
  return REGEX_PATTERNS.TEST_ID.test(testId) && testId.length >= VALIDATION_CONSTRAINTS.TEST_ID_MIN_LENGTH;
};

/**
 * Validates ISO 8601 timestamp format
 */
export const isValidTimestamp = (timestamp: string): boolean => {
  const date = new Date(timestamp);
  return !isNaN(date.getTime());
};

/**
 * Validates device info structure
 */
export const validateDeviceInfo = (deviceInfo: any): void => {
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

/**
 * Validates simple test result structure
 */
export const validateSimpleTestResult = (test: any, testName: string): void => {
  if (!test || typeof test !== "object") {
    throw new ValidationError(`${testName} must be an object`);
  }
  if (typeof test.status !== "boolean") {
    throw new ValidationError(`${testName}.status must be a boolean`);
  }
};

/**
 * Validates screen test result structure
 */
export const validateScreenTest = (screenTest: any): void => {
  if (!screenTest || typeof screenTest !== "object") {
    throw new ValidationError("screenTest must be an object");
  }
  if (typeof screenTest.status !== "boolean") {
    throw new ValidationError("screenTest.status must be a boolean");
  }
  if (typeof screenTest.multiTouchPassed !== "boolean") {
    throw new ValidationError("screenTest.multiTouchPassed must be a boolean");
  }
  if (
    typeof screenTest.coveragePercentage !== "number" ||
    screenTest.coveragePercentage < VALIDATION_CONSTRAINTS.COVERAGE_MIN ||
    screenTest.coveragePercentage > VALIDATION_CONSTRAINTS.COVERAGE_MAX
  ) {
    throw new ValidationError(
      `screenTest.coveragePercentage must be a number between ${VALIDATION_CONSTRAINTS.COVERAGE_MIN} and ${VALIDATION_CONSTRAINTS.COVERAGE_MAX}`
    );
  }
};

/**
 * Validates camera test result structure
 */
export const validateCameraTest = (cameraTest: any): void => {
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

/**
 * Validates fingerprint test result structure
 */
export const validateFingerprintTest = (fingerprintTest: any): void => {
  if (!fingerprintTest || typeof fingerprintTest !== "object") {
    throw new ValidationError("fingerprintTest must be an object");
  }
  const status = fingerprintTest.status;
  if (
    typeof status !== "boolean" &&
    typeof status !== "string"
  ) {
    throw new ValidationError("fingerprintTest.status must be a boolean or string");
  }
};

/**
 * Comprehensive validation for diagnostics data request
 */
export const validateDiagnosticsData = (data: any): void => {
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
  if (!isValidTestId(data.testId)) {
    throw new ValidationError("testId must be alphanumeric");
  }

  // Validate IMEIs
  if (!isValidIMEI(data.imei1)) {
    throw new ValidationError(`imei1 must be a ${VALIDATION_CONSTRAINTS.IMEI_LENGTH}-digit number`);
  }
  if (!isValidIMEI(data.imei2)) {
    throw new ValidationError(`imei2 must be a ${VALIDATION_CONSTRAINTS.IMEI_LENGTH}-digit number`);
  }

  // Validate timestamp
  if (!data.timestamp || !isValidTimestamp(data.timestamp)) {
    throw new ValidationError("timestamp must be a valid ISO 8601 date string");
  }

  // Validate financeStatus
  if (typeof data.financeStatus !== "boolean") {
    throw new ValidationError("financeStatus must be a boolean");
  }

  // Validate device info
  validateDeviceInfo(data.deviceInfo);

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
      validateSimpleTestResult(data[testName], testName);
    }
  }

  // Validate complex test results
  if (data.screenTest) {
    validateScreenTest(data.screenTest);
  }
  if (data.cameraTest) {
    validateCameraTest(data.cameraTest);
  }
  if (data.fingerprintTest) {
    validateFingerprintTest(data.fingerprintTest);
  }
};

/**
 * Sanitizes and normalizes the diagnostics data
 */
export const sanitizeDiagnosticsData = (data: any) => {
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
    isSimCarWorking: normalizeBoolean(data.isSimCarWorking),
    isFinanceWarningSkipped: normalizeBoolean(data.isFinanceWarningSkipped),
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

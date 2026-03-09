/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  VALIDATION_FAILED: "Validation failed",
  DUPLICATE_ENTRY: "Duplicate entry",
  DATABASE_CONNECTION_FAILED: "Database connection failed",
  DATABASE_OPERATION_FAILED: "Database operation failed",
  UNEXPECTED_ERROR: "An unexpected error occurred",
  SERVICE_UNAVAILABLE: "Service temporarily unavailable. Please try again later.",
  GENERIC_ERROR: "An error occurred while processing your request",
} as const;

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  DIAGNOSTICS_UPLOADED: "Diagnostics data uploaded successfully",
  DIAGNOSTICS_RETRIEVED: "Diagnostics data retrieved successfully",
  DIAGNOSTICS_UPDATED: "Diagnostics data updated successfully",
  DIAGNOSTICS_DELETED: "Diagnostics data deleted successfully",
} as const;

/**
 * Validation Constants
 */
export const VALIDATION_CONSTRAINTS = {
  IMEI_LENGTH: 15,
  TEST_ID_MIN_LENGTH: 1,
  TEST_ID_MAX_LENGTH: 50,
  COVERAGE_MIN: 0,
  COVERAGE_MAX: 100,
  MIN_STRING_LENGTH: 1,
  MAX_STRING_LENGTH: 255,
} as const;

/**
 * Regular Expression Patterns
 */
export const REGEX_PATTERNS = {
  IMEI: /^\d{15}$/,
  ALPHANUMERIC: /^[A-Za-z0-9]+$/,
  TEST_ID: /^[A-Za-z0-9]+$/,
} as const;

/**
 * Prisma Error Codes
 */
export const PRISMA_ERROR_CODES = {
  UNIQUE_CONSTRAINT_VIOLATION: "P2002",
  FOREIGN_KEY_CONSTRAINT_VIOLATION: "P2003",
  CONNECTION_ERROR: "P1001",
  CONNECTION_TIMEOUT: "P1002",
  DATABASE_NOT_FOUND: "P1003",
  OPERATION_TIMEOUT: "P1008",
} as const;

/**
 * Test Result Status
 */
export const TEST_STATUS = {
  PASS: "Pass",
  FAIL: "Fail",
  PENDING: "Pending",
  SKIPPED: "Skipped",
} as const;

/**
 * Log Levels
 */
export const LOG_LEVELS = {
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
  DEBUG: "debug",
} as const;

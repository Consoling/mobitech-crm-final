# Diagnostics Data Upload API

## Overview
This API endpoint handles the upload and storage of device diagnostics data from mobile testing processes. The implementation follows enterprise-level software engineering best practices with proper validation, error handling, and separation of concerns.

## Architecture

### Layered Architecture
```
Route Handler (upload-diag-data.route.ts)
    ↓
Service Layer (diagnostics.service.ts)
    ↓
Data Validation (diagnostics.validator.ts)
    ↓
Database (Prisma ORM)
```

### Key Components

1. **Type Definitions** (`types/diagnostics.types.ts`)
   - TypeScript interfaces for type safety
   - Request/Response types
   - Test result structures

2. **Validation Layer** (`utils/diagnostics.validator.ts`)
   - Comprehensive input validation
   - Data sanitization and normalization
   - IMEI format validation
   - Boolean string conversion
   - Test result structure validation

3. **Service Layer** (`services/diagnostics.service.ts`)
   - Business logic separation
   - Duplicate detection
   - Employee verification
   - Transaction management for data consistency
   - Prisma error handling

4. **Route Handler** (`routes/diagnose_routes/upload-diag-data.route.ts`)
   - HTTP request/response handling
   - Error classification and appropriate status codes
   - Request logging and performance monitoring
   - Environment-aware error messaging

## API Endpoint

### POST `/api/diagnose/upload-diag-data`

Upload device diagnostics test results.

#### Request Body

```json
{
  "testId": "767D629",
  "employeeId": "891845",
  "employeeName": "Ariz Shahid",
  "employeeDbID": "cmefqfsf80000efnwmy4pzh17",
  "employeeImageKey": "/temp_diag_selfies/891845-6d1cea2f-0995-4b47-9ff4-f85d3d07d6c0.jpeg",
  "imei1": "868623071306708",
  "imei2": "868623071306716",
  "imeiDetectedModel": "24069PC21I",
  "financeStatus": false,
  "isSimCarWorking": "true",
  "isFinanceWarningSkipped": "false",
  "timestamp": "2026-03-09T13:14:55.491",
  "deviceInfo": {
    "model": "Poco F6 5G",
    "brand": "",
    "ram": "8 GB",
    "storage": "256 GB"
  },
  "wifiTest": { "status": true },
  "bluetoothTest": { "status": true },
  "gpsTest": { "status": true },
  "powerButtonTest": { "status": true },
  "vibrationTest": { "status": true },
  "volumeKeysTest": { "status": true },
  "screenDiscolorationTest": { "status": true },
  "screenTest": {
    "status": true,
    "multiTouchPassed": true,
    "coveragePercentage": 100
  },
  "earpieceTest": { "status": true },
  "speakerTest": { "status": true },
  "microphoneTest": { "status": true },
  "proximityTest": { "status": true },
  "cameraTest": {
    "status": true,
    "frontCameraStatus": true,
    "backCameraStatus": true
  },
  "fingerprintTest": { "status": "Pass" },
  "usbPortTest": { "status": true },
  "audioJackTest": { "status": false }
}
```

#### Response Codes

| Code | Description |
|------|-------------|
| 201  | Successfully created diagnostics data |
| 400  | Validation error (invalid input format) |
| 409  | Conflict (duplicate testId) |
| 500  | Internal server error |
| 503  | Service unavailable (database connection issue) |

#### Success Response (201)

```json
{
  "success": true,
  "message": "Diagnostics data uploaded successfully",
  "data": {
    "id": "...",
    "testId": "767D629",
    "employeeId": "891845",
    "timestamp": "2026-03-09T13:14:55.491Z",
    "deviceInfo": {...},
    "user": {
      "id": "cmefqfsf80000efnwmy4pzh17",
      "phone": "+1234567890",
      "email": "employee@example.com",
      "role": "TECHNICIAN"
    }
    // ... other fields
  }
}
```

#### Error Response (400 - Validation Error)

```json
{
  "success": false,
  "message": "Validation failed",
  "error": "imei1 must be a 15-digit number"
}
```

#### Error Response (409 - Duplicate)

```json
{
  "success": false,
  "message": "Duplicate entry",
  "error": "Diagnostics data with testId '767D629' already exists"
}
```

## Validation Rules

### Required Fields
- `testId` - Alphanumeric, non-empty
- `employeeId` - Non-empty string
- `employeeName` - Non-empty string
- `employeeDbID` - Non-empty string
- `imei1` - Exactly 15 digits
- `imei2` - Exactly 15 digits
- `imeiDetectedModel` - Non-empty string
- `timestamp` - Valid ISO 8601 date string
- `financeStatus` - Boolean
- `deviceInfo` - Object with model, brand, ram, storage

### Test Result Structures

1. **Simple Tests** (WiFi, Bluetooth, GPS, etc.)
   ```typescript
   { status: boolean }
   ```

2. **Screen Test**
   ```typescript
   {
     status: boolean,
     multiTouchPassed: boolean,
     coveragePercentage: number (0-100)
   }
   ```

3. **Camera Test**
   ```typescript
   {
     status: boolean,
     frontCameraStatus: boolean,
     backCameraStatus: boolean
   }
   ```

4. **Fingerprint Test**
   ```typescript
   { status: string | boolean }
   ```

## Features

### Data Consistency
- **Transaction Support**: All database operations wrapped in transactions
- **Duplicate Prevention**: Checks for existing testId before insertion
- **Foreign Key Validation**: Verifies employee exists in database

### Input Validation
- **Type Safety**: TypeScript interfaces for compile-time checks
- **Runtime Validation**: Comprehensive validation of all fields
- **Format Validation**: IMEI, testId, timestamp format checks
- **Nested Object Validation**: Validates all test result structures

### Error Handling
- **Specific Error Types**: ValidationError, Database errors, etc.
- **Proper HTTP Status Codes**: 400, 409, 500, 503
- **Environment-Aware Messages**: Detailed errors in dev, generic in production
- **Error Logging**: Structured logging with timing information

### Performance
- **Request Timing**: Logs execution duration for monitoring
- **Optimized Queries**: Efficient Prisma queries with selective includes
- **Transaction Management**: Ensures ACID properties

### Security
- **Input Sanitization**: Trims whitespace, normalizes data
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **Error Message Safety**: Hides sensitive details in production

## Usage Example

```typescript
// POST request using fetch
const response = await fetch('/api/diagnose/upload-diag-data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    testId: '767D629',
    employeeId: '891845',
    employeeName: 'Ariz Shahid',
    // ... other required fields
  })
});

const result = await response.json();
if (result.success) {
  console.log('Upload successful:', result.data);
} else {
  console.error('Upload failed:', result.error);
}
```

## Testing

### Unit Testing
Test individual validators and service methods:
```typescript
import { validateDiagnosticsData } from './utils/diagnostics.validator';

// Test validation
expect(() => validateDiagnosticsData(invalidData)).toThrow(ValidationError);
```

### Integration Testing
Test the complete flow:
```typescript
import request from 'supertest';
import app from './app';

const response = await request(app)
  .post('/api/diagnose/upload-diag-data')
  .send(validDiagnosticsData)
  .expect(201);

expect(response.body.success).toBe(true);
```

## Future Enhancements

1. **Authentication & Authorization**
   - Add JWT middleware for route protection
   - Role-based access control

2. **Rate Limiting**
   - Implement rate limiting to prevent abuse
   - Per-IP or per-employee limits

3. **Data Versioning**
   - Track changes to diagnostics entries
   - Audit trail for modifications

4. **Webhook Notifications**
   - Notify external systems on successful uploads
   - Failed test alerts

5. **Batch Upload Support**
   - Accept array of diagnostics data
   - Bulk insert optimization

6. **Advanced Analytics**
   - Test pass rate calculations
   - Employee performance metrics
   - Device reliability statistics

## Maintenance

### Logging
All operations are logged with:
- Request identifiers (testId, employeeId)
- Execution duration
- Error details (sanitized in production)

### Monitoring
Monitor these metrics:
- Request success/failure rates
- Response times
- Validation error frequency
- Database connection issues

### Database Indexes
Ensure proper indexes on:
- `testId` (unique)
- `employeeId` (frequent queries)
- `timestamp` (sorting/filtering)
- `imei1`, `imei2` (lookups)

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testAllScenarios = exports.exampleAxiosRequest = exports.exampleFetchRequest = exports.invalidDataInvalidTestStructure = exports.invalidDataInvalidTimestamp = exports.invalidDataInvalidIMEI = exports.invalidDataMissingFields = exports.diagnosticsDataWithFailures = exports.validDiagnosticsData = void 0;
/**
 * Example valid diagnostics data for testing
 */
exports.validDiagnosticsData = {
    testId: "767D629",
    employeeId: "891845",
    employeeName: "Ariz Shahid",
    employeeDbID: "cmefqfsf80000efnwmy4pzh17",
    employeeImageKey: "/temp_diag_selfies/891845-6d1cea2f-0995-4b47-9ff4-f85d3d07d6c0.jpeg",
    imei1: "868623071306708",
    imei2: "868623071306716",
    imeiDetectedModel: "24069PC21I",
    financeStatus: false,
    isSimCarWorking: "true",
    isFinanceWarningSkipped: "false",
    timestamp: "2026-03-09T13:14:55.491",
    deviceInfo: {
        model: "Poco F6 5G",
        brand: "Xiaomi",
        ram: "8 GB",
        storage: "256 GB"
    },
    wifiTest: { status: true },
    bluetoothTest: { status: true },
    gpsTest: { status: true },
    powerButtonTest: { status: true },
    vibrationTest: { status: true },
    volumeKeysTest: { status: true },
    screenDiscolorationTest: { status: true },
    screenTest: {
        status: true,
        multiTouchPassed: true,
        coveragePercentage: 100
    },
    earpieceTest: { status: true },
    speakerTest: { status: true },
    microphoneTest: { status: true },
    proximityTest: { status: true },
    cameraTest: {
        status: true,
        frontCameraStatus: true,
        backCameraStatus: true
    },
    fingerprintTest: { status: "Pass" },
    usbPortTest: { status: true },
    audioJackTest: { status: false }
};
/**
 * Example with failed tests
 */
exports.diagnosticsDataWithFailures = {
    ...exports.validDiagnosticsData,
    testId: "767D630",
    wifiTest: { status: false },
    audioJackTest: { status: false },
    fingerprintTest: { status: "Fail" },
    screenTest: {
        status: false,
        multiTouchPassed: false,
        coveragePercentage: 45
    }
};
/**
 * Example invalid data - missing required fields
 */
exports.invalidDataMissingFields = {
    testId: "767D631",
    employeeId: "891845",
    // Missing other required fields
};
/**
 * Example invalid data - invalid IMEI format
 */
exports.invalidDataInvalidIMEI = {
    ...exports.validDiagnosticsData,
    testId: "767D632",
    imei1: "12345", // Invalid: not 15 digits
    imei2: "67890" // Invalid: not 15 digits
};
/**
 * Example invalid data - invalid timestamp
 */
exports.invalidDataInvalidTimestamp = {
    ...exports.validDiagnosticsData,
    testId: "767D633",
    timestamp: "not-a-valid-date"
};
/**
 * Example invalid data - invalid test result structure
 */
exports.invalidDataInvalidTestStructure = {
    ...exports.validDiagnosticsData,
    testId: "767D634",
    screenTest: {
        status: true,
        // Missing required fields: multiTouchPassed, coveragePercentage
    }
};
/**
 * Example curl command for testing
 *
 * curl -X POST http://localhost:3000/api/diagnose/upload-diag-data \
 *   -H "Content-Type: application/json" \
 *   -d @test-data.json
 */
/**
 * Example using fetch API
 */
const exampleFetchRequest = async () => {
    try {
        const response = await fetch('http://localhost:3000/api/diagnose/upload-diag-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(exports.validDiagnosticsData)
        });
        const result = await response.json();
        if (response.ok && result.success) {
            console.log('✅ Upload successful:', result.data);
            return result.data;
        }
        else {
            console.error('❌ Upload failed:', result.error);
            throw new Error(result.error);
        }
    }
    catch (error) {
        console.error('❌ Request error:', error);
        throw error;
    }
};
exports.exampleFetchRequest = exampleFetchRequest;
/**
 * Example using axios
 */
const exampleAxiosRequest = async () => {
    const axios = require('axios');
    try {
        const response = await axios.post('http://localhost:3000/api/diagnose/upload-diag-data', exports.validDiagnosticsData, {
            headers: {
                'Content-Type': 'application/json',
            }
        });
        console.log('✅ Upload successful:', response.data);
        return response.data;
    }
    catch (error) {
        if (error.response) {
            // Server responded with error status
            console.error('❌ Server error:', error.response.data);
            console.error('Status:', error.response.status);
        }
        else if (error.request) {
            // Request was made but no response received
            console.error('❌ No response received:', error.request);
        }
        else {
            // Error in setting up the request
            console.error('❌ Request setup error:', error.message);
        }
        throw error;
    }
};
exports.exampleAxiosRequest = exampleAxiosRequest;
/**
 * Batch testing helper
 */
const testAllScenarios = async () => {
    const scenarios = [
        { name: 'Valid data', data: exports.validDiagnosticsData, shouldSucceed: true },
        { name: 'Data with failures', data: exports.diagnosticsDataWithFailures, shouldSucceed: true },
        { name: 'Missing fields', data: exports.invalidDataMissingFields, shouldSucceed: false },
        { name: 'Invalid IMEI', data: exports.invalidDataInvalidIMEI, shouldSucceed: false },
        { name: 'Invalid timestamp', data: exports.invalidDataInvalidTimestamp, shouldSucceed: false },
        { name: 'Invalid test structure', data: exports.invalidDataInvalidTestStructure, shouldSucceed: false },
    ];
    for (const scenario of scenarios) {
        console.log(`\n🧪 Testing: ${scenario.name}`);
        try {
            const response = await fetch('http://localhost:3000/api/diagnose/upload-diag-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(scenario.data)
            });
            const result = await response.json();
            if (scenario.shouldSucceed) {
                if (response.ok && result.success) {
                    console.log(`✅ PASS: Request succeeded as expected`);
                }
                else {
                    console.log(`❌ FAIL: Request should have succeeded but failed: ${result.error}`);
                }
            }
            else {
                if (!response.ok || !result.success) {
                    console.log(`✅ PASS: Request failed as expected: ${result.error}`);
                }
                else {
                    console.log(`❌ FAIL: Request should have failed but succeeded`);
                }
            }
        }
        catch (error) {
            console.log(`❌ ERROR: ${error}`);
        }
    }
};
exports.testAllScenarios = testAllScenarios;

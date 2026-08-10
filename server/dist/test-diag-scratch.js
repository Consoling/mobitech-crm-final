"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const diagnostics_service_1 = require("./services/diagnostics.service");
async function testServiceMethods() {
    console.log("=== Testing Diagnostics Service Normalization ===");
    // Test boolean normalization
    console.log("true ->", diagnostics_service_1.DiagnosticsService.normalizeToBoolean(true));
    console.log("'Pass' ->", diagnostics_service_1.DiagnosticsService.normalizeToBoolean("Pass"));
    console.log("'Working' ->", diagnostics_service_1.DiagnosticsService.normalizeToBoolean("Working"));
    console.log("'Not working' ->", diagnostics_service_1.DiagnosticsService.normalizeToBoolean("Not working"));
    console.log("'false' ->", diagnostics_service_1.DiagnosticsService.normalizeToBoolean("false"));
    console.log("null ->", diagnostics_service_1.DiagnosticsService.normalizeToBoolean(null));
    // Test parseVariantRamRom
    console.log("'8GB/128GB' ->", diagnostics_service_1.DiagnosticsService.parseVariantRamRom("8GB/128GB"));
    console.log("'12 GB / 256 GB' ->", diagnostics_service_1.DiagnosticsService.parseVariantRamRom("12 GB / 256 GB"));
    console.log("'8GB' ->", diagnostics_service_1.DiagnosticsService.parseVariantRamRom("8GB"));
    console.log("=== Test formatting Mobitech Diagnostics ===");
    const mockMobitechData = {
        testId: "TEST_MOCK_123",
        imei1: "868623071306708",
        imei2: "868623071306716",
        deviceInfo: { model: "Poco F6 5G", ram: "8 GB", storage: "256 GB" },
        bluetoothTest: { status: true },
        gpsTest: { status: "Pass" },
        wifiTest: { status: true },
        proximityTest: { status: false },
        screenTest: { status: true, multiTouchPassed: true },
        speakerTest: { status: true },
        earpieceTest: { status: true },
        microphoneTest: { status: true },
        cameraTest: { status: true, frontCamera: true, backCamera: true },
        isSimCarWorking: true,
        fingerprintTest: { status: "Pass" },
        usbPortTest: { status: true }
    };
    const formattedMobitech = diagnostics_service_1.DiagnosticsService.formatMobitechDiagnostics(mockMobitechData);
    console.log("Formatted Mobitech output:\n", JSON.stringify(formattedMobitech, null, 2));
    console.log("=== Test formatting Self Diagnostics ===");
    const mockSelfDiagData = {
        diagnoseId: "SELF_MOCK_123",
        imei1: "123456789012345",
        imei2: "123456789012346",
        smc: "Galaxy S23",
        variant: "8GB/256GB",
        bluetooth: "Working",
        wifi: "Working",
        gps: "Working",
        proximity: "Working",
        screenTouch: "Working",
        speaker: "Working",
        microphone: "Working",
        frontCamera: "Working",
        backCamera: "Working",
        sim: "Both SIM are working",
        fingerprint: "Working",
        chargingPort: "Not working"
    };
    const formattedSelf = diagnostics_service_1.DiagnosticsService.formatSelfDiagnostics(mockSelfDiagData);
    console.log("Formatted Self Diag output:\n", JSON.stringify(formattedSelf, null, 2));
}
testServiceMethods().catch(console.error);

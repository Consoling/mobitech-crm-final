"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const diagnostics_service_1 = require("./services/diagnostics.service");
async function testSourceIdentification() {
    console.log("=== Testing Source Identification ===");
    const mockMobitechData = {
        testId: "767D629",
        imei1: "868623071306708",
        imei2: "868623071306716",
        deviceInfo: { model: "Poco F6 5G", ram: "8 GB", storage: "256 GB" },
        bluetoothTest: { status: true },
    };
    const mobitechResult = diagnostics_service_1.DiagnosticsService.formatMobitechDiagnostics(mockMobitechData);
    console.log("Mobitech Result Source Fields:");
    console.log("diagnoseType:", mobitechResult.diagnoseType); // "mobitech"
    console.log("mtype:", mobitechResult.mtype); // "mbdg"
    console.log("testId:", mobitechResult.testId); // "767D629"
    const mockSelfData = {
        diagnoseId: "DIAG_SELF_999",
        smc: "iPhone 13",
        variant: "4GB/128GB",
        bluetooth: "Working",
    };
    const selfResult = diagnostics_service_1.DiagnosticsService.formatSelfDiagnostics(mockSelfData);
    console.log("\nSelf Result Source Fields:");
    console.log("diagnoseType:", selfResult.diagnoseType); // "self"
    console.log("mtype:", selfResult.mtype); // "sfdg"
    console.log("testId:", selfResult.testId); // "DIAG_SELF_999"
}
testSourceIdentification().catch(console.error);

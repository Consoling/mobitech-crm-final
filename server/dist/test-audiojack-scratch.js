"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const diagnostics_service_1 = require("./services/diagnostics.service");
async function testAudioJack() {
    console.log("=== Testing Audio Jack field inclusion ===");
    const mockMobitechData = {
        testId: "767D629",
        imei1: "868623071306708",
        imei2: "868623071306716",
        deviceInfo: { model: "Poco F6 5G", ram: "8 GB", storage: "256 GB" },
        audioJackTest: { status: true }
    };
    const formattedMobitech = diagnostics_service_1.DiagnosticsService.formatMobitechDiagnostics(mockMobitechData);
    console.log("Mobitech audioJack:", formattedMobitech.audioJack);
    const mockSelfData = {
        diagnoseId: "DIAG_SELF_123",
        smc: "Galaxy S23",
        variant: "8GB/256GB",
        audioJack: "Working"
    };
    const formattedSelf = diagnostics_service_1.DiagnosticsService.formatSelfDiagnostics(mockSelfData);
    console.log("Self Diag audioJack:", formattedSelf.audioJack);
}
testAudioJack().catch(console.error);

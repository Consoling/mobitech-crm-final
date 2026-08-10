"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const diagnostics_service_1 = require("./services/diagnostics.service");
function testNormalizationStrictness() {
    console.log("=== Testing Strict Boolean Normalization ===");
    console.log("true ->", diagnostics_service_1.DiagnosticsService.normalizeToBoolean(true)); // true
    console.log("'Pass' ->", diagnostics_service_1.DiagnosticsService.normalizeToBoolean("Pass")); // true
    console.log("'Working' ->", diagnostics_service_1.DiagnosticsService.normalizeToBoolean("Working")); // true
    console.log("{ status: true } ->", diagnostics_service_1.DiagnosticsService.normalizeToBoolean({ status: true })); // true
    console.log("{ status: false } ->", diagnostics_service_1.DiagnosticsService.normalizeToBoolean({ status: false })); // false
    console.log("'Not working' ->", diagnostics_service_1.DiagnosticsService.normalizeToBoolean("Not working")); // false
    console.log("'untested' ->", diagnostics_service_1.DiagnosticsService.normalizeToBoolean("untested")); // false
    console.log("'skipped' ->", diagnostics_service_1.DiagnosticsService.normalizeToBoolean("skipped")); // false
    console.log("'N/A' ->", diagnostics_service_1.DiagnosticsService.normalizeToBoolean("N/A")); // false
    console.log("null ->", diagnostics_service_1.DiagnosticsService.normalizeToBoolean(null)); // false
}
testNormalizationStrictness();

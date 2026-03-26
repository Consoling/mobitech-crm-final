"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const IMEIVerifiedDeviceSchema = new mongoose_1.default.Schema({
    imei: { type: String, unique: true },
    brand: { type: String },
    model: { type: String },
    name: { type: String },
    storedAt: { type: Date, default: Date.now }
}, {
    timestamps: true,
    strict: true
});
const IMEIVerifiedDevice = mongoose_1.default.models.IMEIVerifiedDevice || mongoose_1.default.model('IMEIVerifiedDevice', IMEIVerifiedDeviceSchema);
exports.default = IMEIVerifiedDevice;

import mongoose from 'mongoose';

const IMEIVerifiedDeviceSchema = new mongoose.Schema(
    {
        imei: { type: String, unique: true },
        brand: { type: String },
        model: { type: String },
        name: { type: String },
        storedAt: { type: Date, default: Date.now }
    },
    {
        timestamps: true,
        strict: true
    }
);


const IMEIVerifiedDevice = mongoose.models.IMEIVerifiedDevice || mongoose.model('IMEIVerifiedDevice', IMEIVerifiedDeviceSchema);

export default IMEIVerifiedDevice;
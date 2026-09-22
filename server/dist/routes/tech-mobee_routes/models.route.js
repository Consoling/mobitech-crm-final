"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Device_1 = __importDefault(require("../../models/Device"));
const prisma_1 = require("../../config/prisma");
const router = express_1.default.Router();
// Get Models by Brand Name
router.post("/gmb", async (req, res) => {
    try {
        const { brandName, page = 1, q = "", deviceType = "" } = req.body;
        const searchQuery = typeof q === "string" ? q.trim() : "";
        const pageNumber = Number(page);
        const pageSize = 24;
        if (typeof brandName !== "string" || !brandName.trim()) {
            return res.status(400).json({
                result: "error",
                message: "Brand name is required",
            });
        }
        if (!Number.isInteger(pageNumber) || pageNumber < 1) {
            return res.status(400).json({
                result: "error",
                message: "Page must be a positive integer",
            });
        }
        // Default device type to phone
        const inputDeviceType = typeof deviceType === "string" && deviceType.trim()
            ? deviceType.trim()
            : "phone";
        const escapedBrandName = brandName
            .trim()
            .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const filter = {
            // Brand filter
            brand: new RegExp(`^${escapedBrandName}$`, "i"),
            // Device type filter
            category: new RegExp(`^${inputDeviceType}$`, "i"),
            // detailedSpecifications.variants must exist
            // and contain at least one element
            "detailedSpecifications.variants.0": {
                $exists: true,
            },
        };
        // Search by model name
        if (searchQuery) {
            const escapedSearch = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            filter.model = new RegExp(escapedSearch, "i");
        }
        const skip = (pageNumber - 1) * pageSize;
        const [devices, total] = await Promise.all([
            Device_1.default.find(filter)
                .select("smc model imageUrl -_id")
                .sort({ model: 1 })
                .skip(skip)
                .limit(pageSize)
                .lean(),
            Device_1.default.countDocuments(filter),
        ]);
        const data = devices.map((device) => ({
            slug: device.smc,
            name: device.model,
            img: device.imageUrl,
        }));
        return res.status(200).json({
            result: "success",
            data,
            pagination: {
                page: pageNumber,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
                hasNextPage: skip + data.length < total,
            },
        });
    }
    catch (error) {
        console.error("Failed to fetch models by brand:", error);
        return res.status(500).json({
            result: "error",
            message: "Failed to fetch models",
        });
    }
});
// Get Device Details by SMC
router.get("/gdd/:smc", async (req, res) => {
    try {
        const { smc } = req.params;
        if (!smc || !smc.trim()) {
            return res.status(400).json({
                result: "error",
                message: "SMC is required",
            });
        }
        const device = await Device_1.default.findOne({
            smc: smc.trim(),
            "detailedSpecifications.variants.0": {
                $exists: true,
            },
        })
            .select("model imageUrl detailedSpecifications.variants -_id")
            .lean();
        if (!device) {
            return res.status(404).json({
                result: "error",
                message: "Device not found",
            });
        }
        return res.status(200).json({
            result: "success",
            data: {
                name: device.model,
                image: device.imageUrl,
                variants: device.detailedSpecifications?.variants || [],
            },
        });
    }
    catch (error) {
        console.error("Failed to fetch device details:", error);
        return res.status(500).json({
            result: "error",
            message: "Failed to fetch device details",
        });
    }
});
router.post(`/mbt-ld`, async (req, res) => {
    try {
        const { device, form, phone, name, address, userVerified } = req.body;
        const generateSessionId = () => {
            const timestamp = Date.now().toString(36);
            const randomString = Math.random().toString(36).substring(2, 8);
            return `SOMB-${timestamp}-${randomString}`;
        };
        const sessionId = generateSessionId(); // Generate a unique session ID for the lead
        if (!phone || typeof phone !== "string" || !phone.trim()) {
            return res.status(400).json({
                result: "error",
                message: "Mobile number is required",
            });
        }
        if (!userVerified) {
            return res.status(400).json({
                result: "error",
                message: "Mobile number is not verified",
            });
        }
        if (!device) {
            return res.status(400).json({
                result: "error",
                message: "Device data is required",
            });
        }
        // 1. Find existing customer or create a new one
        const customer = await prisma_1.prisma.customers.upsert({
            where: {
                phone,
            },
            create: {
                firstName: name,
                phone,
                isVerified: userVerified,
                address: {
                    value: address,
                },
            },
            update: {
                isVerified: userVerified,
                address: {
                    value: address,
                },
            },
        });
        // Create or update lead
        const lead = await prisma_1.prisma.leadData.create({
            data: {
                sessionId,
                name,
                mobileNumber: phone,
                address,
                userVerified,
                device,
                form: form ?? {},
                customerId: customer.id,
            },
        });
        return res.status(200).json({
            result: "success",
            message: "Lead submitted successfully",
            data: {
                id: lead.id,
                sessionId: lead.sessionId,
            },
        });
    }
    catch (error) {
        console.error("Failed to upload lead data:", error);
        return res.status(500).json({
            result: "error",
            message: "Failed to upload lead data",
        });
    }
});
// Get Models BY Search Query
router.post("/gms", async (req, res) => {
    try {
        const { q = "", deviceType = "phone" } = req.body;
        const searchQuery = typeof q === "string" ? q.trim() : "";
        if (searchQuery.length < 2) {
            return res.status(200).json({
                result: "success",
                data: [],
            });
        }
        const inputDeviceType = typeof deviceType === "string" && deviceType.trim()
            ? deviceType.trim()
            : "phone";
        if (!searchQuery) {
            return res.status(400).json({
                result: "error",
                message: "Search query is required",
            });
        }
        /*
         * Escape regex special characters
         */
        const escapedSearch = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        /*
         * Device type filter
         */
        const filter = {
            category: new RegExp(`^${inputDeviceType}$`, "i"),
            "detailedSpecifications.variants.0": {
                $exists: true,
            },
            model: new RegExp(escapedSearch, "i"),
        };
        /*
         * Fetch a few more results first so we can
         * prioritize exact/prefix matches.
         */
        const devices = await Device_1.default.find(filter)
            .select("smc model brand imageUrl model -_id")
            .lean();
        /*
         * Rank results:
         *
         * 1. Exact model match
         * 2. Model starts with query
         * 3. Model contains query
         */
        const normalizedQuery = searchQuery.toLowerCase();
        const rankedDevices = devices
            .map((device) => {
            const model = String(device.model || "").toLowerCase();
            let score = 0;
            if (model === normalizedQuery) {
                score = 3;
            }
            else if (model.startsWith(normalizedQuery)) {
                score = 2;
            }
            else {
                score = 1;
            }
            return {
                ...device,
                score,
            };
        })
            .sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return String(a.model).localeCompare(String(b.model));
        })
            .slice(0, 6);
        /*
         * Return only required fields
         */
        const data = rankedDevices.map((device) => ({
            smc: device.smc,
            brand: device.brand,
            image: device.imageUrl,
            name: device.model,
        }));
        return res.status(200).json({
            result: "success",
            data,
        });
    }
    catch (error) {
        console.error("Failed to search device models:", error);
        return res.status(500).json({
            result: "error",
            message: "Failed to search models",
        });
    }
});
exports.default = router;

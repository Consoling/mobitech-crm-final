"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Device_1 = __importDefault(require("../../../models/Device"));
const pickupauth_middleware_1 = require("../../../middlewares/pickupauth.middleware");
const router = express_1.default.Router();
const BRANDS = {
    phone: [
        "apple",
        "xiaomi",
        "samsung",
        "vivo",
        "oneplus",
        "oppo",
        "realme",
        "motorola",
        "tecno",
        "nokia",
        "honor",
        "google",
        "poco",
        "infinix",
        "iqoo",
        "nothing",
    ],
    tablet: ["apple", "samsung", "xiaomi", "lenovo", "honor", "huawei"],
    laptop: ["apple", "asus", "lenovo", "hp", "dell", "acer", "msi", "huawei"],
};
router.post("/device-count", pickupauth_middleware_1.authenticate, async (req, res) => {
    try {
        const { deviceType } = req.body;
        console.log("Received device count request for type:", deviceType);
        if (!deviceType) {
            return res.status(400).json({
                success: false,
                message: "Device type is required",
            });
        }
        const allowedBrands = BRANDS[deviceType];
        if (!allowedBrands) {
            return res.status(400).json({
                success: false,
                message: "Invalid device type",
            });
        }
        const dbCounts = await Device_1.default.aggregate([
            {
                $match: {
                    category: deviceType,
                },
            },
            {
                $group: {
                    _id: "$brand",
                    count: {
                        $sum: 1,
                    },
                },
            },
        ]);
        const countMap = new Map(dbCounts.map((item) => [item._id.toLowerCase(), item.count]));
        const brands = allowedBrands.map((brand) => ({
            brand,
            count: countMap.get(brand.toLowerCase()) || 0,
        }));
        return res.status(200).json({
            success: true,
            message: "Device count fetched successfully",
            data: brands,
        });
    }
    catch (error) {
        console.error("Error fetching device count:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
});
router.get("/models", pickupauth_middleware_1.authenticate, async (req, res) => {
    try {
        const { category, brand, page = "1", limit = "10", search = "", } = req.query;
        if (!category || !brand) {
            return res.status(400).json({
                success: false,
                message: "Category and brand are required",
            });
        }
        const currentPage = Math.max(Number(page) || 1, 1);
        const pageLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
        const filter = {
            category,
            brand: String(brand).toLowerCase(),
        };
        const searchTerm = String(search).trim();
        if (searchTerm) {
            filter.model = {
                $regex: searchTerm,
                $options: "i",
            };
        }
        const [models, total] = await Promise.all([
            Device_1.default.find(filter)
                .select("_id brand model smc category imageUrl price detailedSpecifications.variants modelCodes")
                .sort({ model: 1 })
                .skip((currentPage - 1) * pageLimit)
                .limit(pageLimit)
                .lean(),
            Device_1.default.countDocuments(filter),
        ]);
        return res.status(200).json({
            success: true,
            data: {
                items: models,
                count: models.length,
                pagination: {
                    page: currentPage,
                    limit: pageLimit,
                    total,
                    pages: Math.ceil(total / pageLimit),
                    hasNextPage: currentPage * pageLimit < total,
                },
            },
        });
    }
    catch (error) {
        console.error("Error fetching device models:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
});
exports.default = router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Device_1 = __importDefault(require("../models/Device"));
const zod_1 = require("zod");
// Zod Schema for validating add model request body
const addModelSchema = zod_1.z.object({
    category: zod_1.z.string().min(1, "Category is required"),
    productImage: zod_1.z.string().url("Invalid image URL").min(1, "Product image is required"),
    modelName: zod_1.z.string().min(1, "Model name is required"),
    variants: zod_1.z.record(zod_1.z.string(), zod_1.z.object({
        variant: zod_1.z.string().min(1, "Variant name is required"),
        price: zod_1.z.string().min(1, "Price is required"),
    })).refine((variants) => Object.keys(variants).length > 0, {
        message: "At least one variant is required",
    }),
    modelCodes: zod_1.z.array(zod_1.z.string().min(1)).min(1, "At least one model code is required"),
    brand: zod_1.z.string().min(1, "Brand is required"),
});
const router = express_1.default.Router();
// OPTIMIZED SEARCH ENDPOINT
// Uses efficient algorithms for fast autocomplete search
// Time Complexity: O(log n) for indexed DB queries + O(k) for result processing
// Space Complexity: O(k) where k is the number of results
router.get('/search', async (req, res) => {
    try {
        const searchRaw = Array.isArray(req.query.q) ? req.query.q[0] : req.query.q;
        const search = typeof searchRaw === "string" ? searchRaw.trim() : "";
        if (!search || search.length < 2) {
            return res.status(200).json({
                success: true,
                data: { models: [], modelCodes: [] },
            });
        }
        const limit = 10; // Limit results to prevent overwhelming client
        // Create case-insensitive regex pattern for prefix matching
        // Uses MongoDB indexed regex for O(log n) performance
        const regexPattern = new RegExp(`^${search}`, 'i');
        const containsPattern = new RegExp(search, 'i');
        // Parallel queries for better performance
        // Both queries use indexes for optimal speed
        const [modelMatches, modelCodeMatches] = await Promise.all([
            // Query 1: Search in model names (prefix match prioritized)
            Device_1.default.find({
                model: regexPattern
            })
                .select('_id model imageUrl smc brand')
                .limit(limit)
                .lean() // Use lean() for faster queries (returns plain JS objects)
                .exec(),
            // Query 2: Search in modelCodes array (exact and partial matches)
            Device_1.default.find({
                modelCodes: { $elemMatch: { $regex: containsPattern } }
            })
                .select('_id model imageUrl smc brand modelCodes')
                .limit(limit)
                .lean()
                .exec()
        ]);
        // Process model code matches to extract matching codes
        // Time Complexity: O(k*m) where k is results and m is avg modelCodes length
        const processedModelCodes = modelCodeMatches.map(device => ({
            _id: device._id,
            model: device.model,
            imageUrl: device.imageUrl,
            smc: device.smc,
            brand: device.brand,
            matchingCode: device.modelCodes?.find((code) => containsPattern.test(code)) || device.modelCodes?.[0]
        }));
        // Remove duplicates using Set for O(n) deduplication
        const modelIds = new Set(modelMatches.map(m => m._id.toString()));
        const uniqueModelCodeMatches = processedModelCodes.filter(m => !modelIds.has(m._id.toString()));
        return res.status(200).json({
            success: true,
            data: {
                models: modelMatches,
                modelCodes: uniqueModelCodeMatches.slice(0, 5), // Limit model code results
            },
        });
    }
    catch (error) {
        console.error('Error in search:', error);
        return res.status(500).json({
            success: false,
            error: 'Search failed',
        });
    }
});
router.get('/get-counts', async (req, res) => {
    try {
        const brandCounts = await Device_1.default.aggregate([
            {
                $group: {
                    _id: "$brand",
                    count: { $sum: 1 },
                },
            },
            { $project: { _id: 0, brand: "$_id", count: 1 } },
            { $sort: { count: -1 } },
        ]);
        return res.status(200).json({
            success: true,
            data: brandCounts,
        });
    }
    catch (error) {
        console.error('Error fetching model counts:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch model counts',
        });
    }
});
// GET single model by SMC
router.get('/model/:smc', async (req, res) => {
    try {
        const { smc } = req.params;
        const model = await Device_1.default.findOne({ smc });
        if (!model) {
            return res.status(404).json({
                success: false,
                error: 'Model not found',
            });
        }
        return res.status(200).json({
            success: true,
            data: model,
        });
    }
    catch (error) {
        console.error('Error fetching model:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch model',
        });
    }
});
// UPDATE model by SMC
router.put('/model/:smc', async (req, res) => {
    try {
        const { smc } = req.params;
        const updateData = req.body;
        const allowedFields = [
            'model',
            'brand',
            'price',
            'imageUrl',
            'productUrl',
            'modelCodes',
            'specifications',
            'detailedSpecifications', // Added for variants
        ];
        const filteredData = {};
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                filteredData[field] = updateData[field];
            }
        });
        // If updating detailedSpecifications.variants specifically
        if (updateData.variants) {
            filteredData['detailedSpecifications.variants'] = updateData.variants;
            // Ensure we're not overwriting detailedSpecifications fully
            delete filteredData.detailedSpecifications;
        }
        filteredData.updatedAt = new Date();
        const updatedModel = await Device_1.default.findOneAndUpdate({ smc }, { $set: filteredData }, {
            new: true,
            runValidators: true
        });
        if (!updatedModel) {
            return res.status(404).json({
                success: false,
                error: 'Model not found',
            });
        }
        return res.status(200).json({
            success: true,
            data: updatedModel,
            message: 'Model updated successfully',
        });
    }
    catch (error) {
        console.error('Error updating model:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to update model',
        });
    }
});
// DELETE model by SMC
router.delete('/model/:smc', async (req, res) => {
    try {
        const { smc } = req.params;
        const deletedModel = await Device_1.default.findOneAndDelete({ smc });
        if (!deletedModel) {
            return res.status(404).json({
                success: false,
                error: 'Model not found',
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Model deleted successfully',
            data: deletedModel,
        });
    }
    catch (error) {
        console.error('Error deleting model:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to delete model',
        });
    }
});
router.post(`/model/add`, async (req, res) => {
    try {
        // Validate request body
        const validationResult = addModelSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validationResult.error.issues.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                })),
            });
        }
        const { category, productImage, modelName, variants, modelCodes, brand } = validationResult.data;
        // Generate unique SMC (you may want to implement a better SMC generation logic)
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
        const smc = `${brand.substring(0, 3).toUpperCase()}-${randomStr}-${timestamp}`;
        // Transform variants from object to array format expected by Device model
        const variantsArray = Object.values(variants).map(v => ({
            name: v.variant,
            price: v.price,
        }));
        // Create new device model
        const newDevice = new Device_1.default({
            smc,
            brand: brand.toLowerCase(),
            category: category.toLowerCase(),
            model: modelName,
            imageUrl: productImage,
            modelCodes,
            specifications: [], // Empty array for now, can be populated later
            detailedSpecifications: {
                title: modelName,
                variants: variantsArray,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        await newDevice.save();
        return res.status(201).json({
            success: true,
            message: 'Model added successfully',
            data: newDevice,
        });
    }
    catch (error) {
        console.error('Error adding model:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to add model',
        });
    }
});
router.get("/:brand", async (req, res) => {
    try {
        const { brand } = req.params;
        const pageRaw = Array.isArray(req.query.page)
            ? req.query.page[0]
            : req.query.page;
        const limitRaw = Array.isArray(req.query.limit)
            ? req.query.limit[0]
            : req.query.limit;
        const searchRaw = Array.isArray(req.query.search)
            ? req.query.search[0]
            : req.query.search;
        const page = Number.parseInt(typeof pageRaw === "string" ? pageRaw : "", 10) || 1;
        const limit = Number.parseInt(typeof limitRaw === "string" ? limitRaw : "", 10) || 10;
        const search = typeof searchRaw === "string" ? searchRaw : "";
        const skip = (page - 1) * limit;
        console.log("Brand:", brand, "Page:", page, "Limit:", limit, "Search:", search);
        const query = { brand: brand.toLowerCase() };
        if (search) {
            query.$or = [
                { model: { $regex: search, $options: "i" } },
                { modelCodes: { $elemMatch: { $regex: search, $options: "i" } } },
            ];
        }
        // Select only required fields
        const models = await Device_1.default.find(query)
            .select("_id model price imageUrl modelCodes specifications smc")
            .skip(skip)
            .limit(limit)
            .sort({ updatedAt: -1 });
        const total = await Device_1.default.countDocuments(query);
        return res.status(200).json({
            success: true,
            data: models,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        console.error("Error fetching models:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch models",
        });
    }
});
exports.default = router;

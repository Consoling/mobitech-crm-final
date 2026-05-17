"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../config/prisma");
const router = express_1.default.Router();
router.get("/fetch-customers", async (req, res) => {
    try {
        const customers = await prisma_1.prisma.customers.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                purchases: true,
            },
        });
        return res.status(200).json({ customers });
    }
    catch (error) {
        console.error("Error fetching customers:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
router.post("/add-customer", async (req, res) => {
    try {
        const body = req.body ?? {};
        const firstName = String(body.firstName ?? "").trim();
        const lastName = body.lastName ? String(body.lastName).trim() : null;
        const email = body.email ? String(body.email).trim() : null;
        const phone = String(body.phone ?? "").trim();
        const streetAddress = body.streetAddress
            ? String(body.streetAddress).trim()
            : "";
        const area = body.area ? String(body.area).trim() : "";
        const city = body.city ? String(body.city).trim() : "";
        const state = body.state ? String(body.state).trim() : "";
        const pinCode = body.pinCode ? String(body.pinCode).trim() : "";
        if (!firstName || !phone) {
            return res
                .status(400)
                .json({ message: "First name and phone number are required" });
        }
        const hasAddress = Boolean(streetAddress || area || city || state || pinCode);
        const created = await prisma_1.prisma.customers.create({
            data: {
                firstName,
                lastName,
                email,
                phone,
                address: hasAddress
                    ? {
                        streetAddress: streetAddress,
                        area: area,
                        city: city,
                        state: state,
                        pinCode: pinCode,
                    }
                    : undefined,
            },
        });
        return res.status(201).json({
            success: true,
            customer: {
                id: created.id,
                firstName: created.firstName,
                lastName: created.lastName,
                email: created.email,
                phone: created.phone,
            },
            message: "Customer created successfully",
        });
    }
    catch (error) {
        console.error("Error creating customer:", error);
        if (error?.code === "P2002") {
            return res
                .status(400)
                .json({ message: "Customer with this phone or email already exists" });
        }
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
router.get("/:customerId", async (req, res) => {
    try {
        const { customerId } = req.params;
        if (!customerId) {
            return res.status(400).json({ message: "customerId is required" });
        }
        const customer = await prisma_1.prisma.customers.findUnique({
            where: { id: customerId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                address: true,
                purchases: {
                    select: {
                        id: true,
                        model: true,
                        imei: true,
                        purchaseDate: true,
                        price: true,
                    },
                    orderBy: {
                        purchaseDate: "desc",
                    },
                },
            },
        });
        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }
        const address = customer.address ?? null;
        return res.status(200).json({
            customer: {
                id: customer.id,
                firstName: customer.firstName,
                lastName: customer.lastName,
                email: customer.email,
                phone: customer.phone,
                streetAddress: String(address?.streetAddress ?? ""),
                area: String(address?.area ?? ""),
                city: String(address?.city ?? ""),
                state: String(address?.state ?? ""),
                pinCode: String(address?.pinCode ?? ""),
                purchases: customer.purchases,
            },
        });
    }
    catch (error) {
        console.error("Error fetching customer by id:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
router.put("/:customerId", async (req, res) => {
    try {
        const { customerId } = req.params;
        if (!customerId) {
            return res.status(400).json({ message: "customerId is required" });
        }
        const body = req.body ?? {};
        const firstName = String(body.firstName ?? "").trim();
        const lastName = body.lastName ? String(body.lastName).trim() : null;
        const email = body.email ? String(body.email).trim() : null;
        const phone = String(body.phone ?? "").trim();
        const streetAddress = body.streetAddress
            ? String(body.streetAddress).trim()
            : "";
        const area = body.area ? String(body.area).trim() : "";
        const city = body.city ? String(body.city).trim() : "";
        const state = body.state ? String(body.state).trim() : "";
        const pinCode = body.pinCode ? String(body.pinCode).trim() : "";
        if (!firstName || !phone) {
            return res
                .status(400)
                .json({ message: "First name and phone number are required" });
        }
        const hasAddress = Boolean(streetAddress || area || city || state || pinCode);
        const updated = await prisma_1.prisma.customers.update({
            where: { id: customerId },
            data: {
                firstName,
                lastName,
                email,
                phone,
                address: hasAddress
                    ? {
                        streetAddress,
                        area,
                        city,
                        state,
                        pinCode,
                    }
                    : undefined,
            },
        });
        return res.status(200).json({
            success: true,
            customer: {
                id: updated.id,
                firstName: updated.firstName,
                lastName: updated.lastName,
                email: updated.email,
                phone: updated.phone,
            },
            message: "Customer updated successfully",
        });
    }
    catch (error) {
        console.error("Error updating customer:", error);
        if (error?.code === "P2025") {
            return res.status(404).json({ message: "Customer not found" });
        }
        if (error?.code === "P2002") {
            return res
                .status(400)
                .json({ message: "Customer with this phone or email already exists" });
        }
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.default = router;

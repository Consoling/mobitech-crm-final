"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../config/prisma");
const redis_1 = require("../config/redis");
const enums_1 = require("../generated/prisma/enums");
const router = express_1.default.Router();
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const LIST_TTL_SECONDS = 30;
const SUMMARY_TTL_SECONDS = 60;
const UI_ROLE_ORDER = [
    "Admin",
    "Store Manager",
    "Sales Agent",
    "Technician",
    "Field Executive",
    "Exchange Partner",
];
const ROLE_LABEL_TO_ENUM = {
    Admin: enums_1.Role.ADMIN,
    "Store Manager": enums_1.Role.MANAGER,
    "Sales Agent": enums_1.Role.MARKETING_EXECUTIVE,
    Technician: enums_1.Role.TECHNICIAN,
    "Field Executive": enums_1.Role.FIELD_EXECUTIVE,
    "Exchange Partner": null,
};
const EMPLOYEE_DB_ROLES = [
    enums_1.Role.ADMIN,
    enums_1.Role.MANAGER,
    enums_1.Role.FIELD_EXECUTIVE,
    enums_1.Role.MARKETING_EXECUTIVE,
    enums_1.Role.TECHNICIAN,
];
const CDN_BASE_URL = process.env.CDN_BASE_URL?.replace(/\/$/, "") ?? "";
const parseStringArray = (input) => {
    if (Array.isArray(input)) {
        return input
            .flatMap((item) => String(item).split(","))
            .map((item) => item.trim())
            .filter(Boolean);
    }
    if (typeof input === "string") {
        return input
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return [];
};
const parsePage = (input) => {
    const parsed = Number(input);
    if (!Number.isFinite(parsed) || parsed < 1) {
        return DEFAULT_PAGE;
    }
    return Math.floor(parsed);
};
const parseLimit = (input) => {
    const parsed = Number(input);
    if (!Number.isFinite(parsed) || parsed < 1) {
        return DEFAULT_LIMIT;
    }
    return Math.min(Math.floor(parsed), MAX_LIMIT);
};
const toUiStatus = (status) => {
    return status === enums_1.UserStatus.ACTIVE ? "Active" : "Inactive";
};
const toDbStatuses = (statusFilters) => {
    const normalized = new Set(statusFilters.map((status) => status.toLowerCase()));
    const values = [];
    if (normalized.has("active")) {
        values.push(enums_1.UserStatus.ACTIVE);
    }
    if (normalized.has("inactive")) {
        values.push(enums_1.UserStatus.INACTIVE);
    }
    return values;
};
const toUiRole = (role, isAdmin) => {
    if (isAdmin || role === enums_1.Role.ADMIN) {
        return "Admin";
    }
    if (role === enums_1.Role.MANAGER) {
        return "Store Manager";
    }
    if (role === enums_1.Role.MARKETING_EXECUTIVE) {
        return "Sales Agent";
    }
    if (role === enums_1.Role.TECHNICIAN) {
        return "Technician";
    }
    if (role === enums_1.Role.FIELD_EXECUTIVE) {
        return "Field Executive";
    }
    return "Exchange Partner";
};
const getDateRangeStart = (range) => {
    if (!range) {
        return null;
    }
    const currentDate = new Date();
    if (range === "thisWeek") {
        const startOfWeek = new Date(currentDate);
        const dayOfWeek = (currentDate.getDay() + 6) % 7;
        startOfWeek.setDate(currentDate.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);
        return startOfWeek;
    }
    if (range === "thisMonth") {
        return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    }
    if (range === "thisYear") {
        return new Date(currentDate.getFullYear(), 0, 1);
    }
    return null;
};
const getDisplayName = (user) => {
    const candidate = user.admin ??
        user.manager ??
        user.technician ??
        user.fieldExecutive ??
        user.salesExecutive;
    if (!candidate) {
        return user.phone;
    }
    return [candidate.firstName, candidate.lastName].filter(Boolean).join(" ") || user.phone;
};
const getEmployeeId = (user) => {
    return (user.admin?.employeeId ??
        user.manager?.employeeId ??
        user.technician?.employeeId ??
        user.fieldExecutive?.employeeId ??
        user.salesExecutive?.employeeId ??
        null);
};
const getImagePayload = (key) => {
    if (!key) {
        return null;
    }
    return {
        key,
        url: CDN_BASE_URL ? `${CDN_BASE_URL}/${key}` : null,
    };
};
const withCachingHeaders = (req, res, payload, maxAge) => {
    const body = JSON.stringify(payload);
    const etag = `W/\"${crypto_1.default.createHash("sha1").update(body).digest("hex")}\"`;
    res.setHeader("ETag", etag);
    res.setHeader("Cache-Control", `private, max-age=${maxAge}, stale-while-revalidate=${maxAge * 4}`);
    if (req.headers["if-none-match"] === etag) {
        res.status(304).end();
        return;
    }
    res.status(200).json(payload);
};
const readRouteCache = async (key) => {
    try {
        const cached = await redis_1.redisClient.get(key);
        if (!cached) {
            return null;
        }
        return JSON.parse(cached);
    }
    catch {
        return null;
    }
};
const writeRouteCache = async (key, payload, ttlSeconds) => {
    try {
        await redis_1.redisClient.set(key, JSON.stringify(payload), "EX", ttlSeconds);
    }
    catch {
        // fail open: request should still succeed even if cache write fails
    }
};
router.get("/summary", async (req, res) => {
    try {
        const cacheKey = `team:summary`;
        const cached = await readRouteCache(cacheKey);
        if (cached) {
            return withCachingHeaders(req, res, cached, SUMMARY_TTL_SECONDS);
        }
        const employeeBaseWhere = {
            OR: [{ isAdmin: true }, { role: { in: EMPLOYEE_DB_ROLES } }],
        };
        const [totalEmployees, totalStores, activeUsers, inactiveUsers] = await Promise.all([
            prisma_1.prisma.user.count({ where: employeeBaseWhere }),
            prisma_1.prisma.store.count(),
            prisma_1.prisma.user.count({ where: { ...employeeBaseWhere, status: enums_1.UserStatus.ACTIVE } }),
            prisma_1.prisma.user.count({ where: { ...employeeBaseWhere, status: enums_1.UserStatus.INACTIVE } }),
        ]);
        const payload = {
            data: {
                activeUsers,
                inactiveUsers,
                totalEmployees,
                totalStores,
            },
            meta: {
                cachedAt: new Date().toISOString(),
            },
        };
        await writeRouteCache(cacheKey, payload, SUMMARY_TTL_SECONDS);
        return withCachingHeaders(req, res, payload, SUMMARY_TTL_SECONDS);
    }
    catch (error) {
        console.error("team summary error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
router.get("/employees", async (req, res) => {
    try {
        const page = parsePage(req.query.page);
        const limit = parseLimit(req.query.limit);
        const skip = (page - 1) * limit;
        const search = String(req.query.search ?? "").trim();
        const createdAtRange = typeof req.query.createdAtRange === "string" ? req.query.createdAtRange : undefined;
        const dateStart = getDateRangeStart(createdAtRange);
        const statusFilters = toDbStatuses(parseStringArray(req.query.status));
        const roleFilters = parseStringArray(req.query.role);
        const sortBy = typeof req.query.sortBy === "string" ? req.query.sortBy : "createdAt";
        const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";
        const baseWhere = {
            AND: [
                {
                    OR: [{ isAdmin: true }, { role: { in: EMPLOYEE_DB_ROLES } }],
                },
            ],
        };
        const andConditions = baseWhere.AND;
        if (search) {
            andConditions.push({
                OR: [
                    { phone: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                    { admin: { is: { employeeId: { contains: search, mode: "insensitive" } } } },
                    { admin: { is: { firstName: { contains: search, mode: "insensitive" } } } },
                    { admin: { is: { lastName: { contains: search, mode: "insensitive" } } } },
                    { manager: { is: { employeeId: { contains: search, mode: "insensitive" } } } },
                    { manager: { is: { firstName: { contains: search, mode: "insensitive" } } } },
                    { manager: { is: { lastName: { contains: search, mode: "insensitive" } } } },
                    { technician: { is: { employeeId: { contains: search, mode: "insensitive" } } } },
                    { technician: { is: { firstName: { contains: search, mode: "insensitive" } } } },
                    { technician: { is: { lastName: { contains: search, mode: "insensitive" } } } },
                    { fieldExecutive: { is: { employeeId: { contains: search, mode: "insensitive" } } } },
                    { fieldExecutive: { is: { firstName: { contains: search, mode: "insensitive" } } } },
                    { fieldExecutive: { is: { lastName: { contains: search, mode: "insensitive" } } } },
                    { salesExecutive: { is: { employeeId: { contains: search, mode: "insensitive" } } } },
                    { salesExecutive: { is: { firstName: { contains: search, mode: "insensitive" } } } },
                    { salesExecutive: { is: { lastName: { contains: search, mode: "insensitive" } } } },
                ],
            });
        }
        if (statusFilters.length > 0) {
            andConditions.push({ status: { in: statusFilters } });
        }
        if (dateStart) {
            andConditions.push({ createdAt: { gte: dateStart, lte: new Date() } });
        }
        const roleEnums = roleFilters
            .map((role) => ROLE_LABEL_TO_ENUM[role] ?? enums_1.Role[role])
            .filter((role) => Boolean(role));
        const adminRequested = roleFilters.some((role) => role === "Admin" || role === enums_1.Role.ADMIN);
        if (roleFilters.length > 0) {
            const roleOrConditions = [];
            if (adminRequested) {
                roleOrConditions.push({ isAdmin: true });
                roleOrConditions.push({ role: enums_1.Role.ADMIN });
            }
            const nonAdminRoles = roleEnums.filter((role) => role !== enums_1.Role.ADMIN);
            if (nonAdminRoles.length > 0) {
                roleOrConditions.push({ role: { in: nonAdminRoles } });
            }
            if (roleOrConditions.length > 0) {
                andConditions.push({ OR: roleOrConditions });
            }
        }
        const orderBy = sortBy === "status"
            ? { status: sortOrder }
            : sortBy === "role"
                ? { role: sortOrder }
                : { createdAt: sortOrder };
        const cacheKey = `team:employees:${JSON.stringify({
            page,
            limit,
            search,
            createdAtRange,
            statusFilters,
            roleFilters,
            sortBy,
            sortOrder,
        })}`;
        const cached = await readRouteCache(cacheKey);
        if (cached) {
            return withCachingHeaders(req, res, cached, LIST_TTL_SECONDS);
        }
        const [total, users, groupedRoleCounts, adminCount] = await Promise.all([
            prisma_1.prisma.user.count({ where: baseWhere }),
            prisma_1.prisma.user.findMany({
                where: baseWhere,
                skip,
                take: limit,
                orderBy,
                select: {
                    id: true,
                    phone: true,
                    email: true,
                    createdAt: true,
                    role: true,
                    status: true,
                    isAdmin: true,
                    profileImage: true,
                    admin: { select: { firstName: true, lastName: true, employeeId: true } },
                    manager: { select: { firstName: true, lastName: true, employeeId: true } },
                    technician: { select: { firstName: true, lastName: true, employeeId: true } },
                    fieldExecutive: { select: { firstName: true, lastName: true, employeeId: true } },
                    salesExecutive: { select: { firstName: true, lastName: true, employeeId: true } },
                },
            }),
            prisma_1.prisma.user.groupBy({
                by: ["role"],
                where: baseWhere,
                _count: { _all: true },
            }),
            prisma_1.prisma.user.count({
                where: {
                    ...baseWhere,
                    OR: [{ isAdmin: true }, { role: enums_1.Role.ADMIN }],
                },
            }),
        ]);
        const groupedRoleMap = groupedRoleCounts.reduce((accumulator, item) => {
            if (item.role) {
                accumulator[item.role] = item._count._all;
            }
            return accumulator;
        }, {});
        const roleCounts = {
            Admin: adminCount,
            "Store Manager": groupedRoleMap[enums_1.Role.MANAGER] ?? 0,
            "Sales Agent": groupedRoleMap[enums_1.Role.MARKETING_EXECUTIVE] ?? 0,
            Technician: groupedRoleMap[enums_1.Role.TECHNICIAN] ?? 0,
            "Field Executive": groupedRoleMap[enums_1.Role.FIELD_EXECUTIVE] ?? 0,
            "Exchange Partner": 0,
        };
        const payload = {
            items: users.map((user) => ({
                id: user.id,
                name: getDisplayName(user),
                email: user.email,
                employeeId: getEmployeeId(user),
                phone: user.phone,
                createdAt: user.createdAt,
                role: toUiRole(user.role, user.isAdmin),
                status: toUiStatus(user.status),
                avatar: getImagePayload(user.profileImage),
            })),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                filters: {
                    roleCounts,
                    roleOrder: UI_ROLE_ORDER,
                },
            },
        };
        await writeRouteCache(cacheKey, payload, LIST_TTL_SECONDS);
        return withCachingHeaders(req, res, payload, LIST_TTL_SECONDS);
    }
    catch (error) {
        console.error("team employees error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
router.get("/employees/:employeeID", async (req, res) => {
    try {
        const employeeID = String(req.params.employeeID ?? "").trim();
        if (!employeeID) {
            return res.status(400).json({ message: "employeeID is required" });
        }
        const cacheKey = `team:employee-details:${employeeID}`;
        const cached = await readRouteCache(cacheKey);
        if (cached) {
            return withCachingHeaders(req, res, cached, LIST_TTL_SECONDS);
        }
        const user = await prisma_1.prisma.user.findFirst({
            where: {
                AND: [
                    { OR: [{ isAdmin: true }, { role: { in: EMPLOYEE_DB_ROLES } }] },
                    {
                        OR: [
                            { admin: { is: { employeeId: employeeID } } },
                            { manager: { is: { employeeId: employeeID } } },
                            { technician: { is: { employeeId: employeeID } } },
                            { fieldExecutive: { is: { employeeId: employeeID } } },
                            { salesExecutive: { is: { employeeId: employeeID } } },
                        ],
                    },
                ],
            },
            select: {
                id: true,
                phone: true,
                email: true,
                role: true,
                status: true,
                isAdmin: true,
                profileImage: true,
                aadharFrontImage: true,
                aadharBackImage: true,
                qualificationImage: true,
                salary: true,
                payoutDate: true,
                storeId: true,
                createdBy: true,
                dateOfJoining: true,
                dateOfTermination: true,
                createdAt: true,
                updatedAt: true,
                admin: {
                    select: {
                        firstName: true,
                        lastName: true,
                        employeeId: true,
                    },
                },
                manager: {
                    select: {
                        firstName: true,
                        lastName: true,
                        employeeId: true,
                        aadharId: true,
                        bankDetails: {
                            select: {
                                accountNumber: true,
                                ifsc: true,
                                bankName: true,
                                beneficiaryName: true,
                                upiId: true,
                            },
                        },
                    },
                },
                technician: {
                    select: {
                        firstName: true,
                        lastName: true,
                        employeeId: true,
                        aadharId: true,
                        bankDetails: {
                            select: {
                                accountNumber: true,
                                ifsc: true,
                                bankName: true,
                                beneficiaryName: true,
                                upiId: true,
                            },
                        },
                    },
                },
                fieldExecutive: {
                    select: {
                        firstName: true,
                        lastName: true,
                        employeeId: true,
                        aadharId: true,
                        bankDetails: {
                            select: {
                                accountNumber: true,
                                ifsc: true,
                                bankName: true,
                                beneficiaryName: true,
                                upiId: true,
                            },
                        },
                    },
                },
                salesExecutive: {
                    select: {
                        firstName: true,
                        lastName: true,
                        employeeId: true,
                        aadharId: true,
                        bankDetails: {
                            select: {
                                accountNumber: true,
                                ifsc: true,
                                bankName: true,
                                beneficiaryName: true,
                                upiId: true,
                            },
                        },
                    },
                },
            },
        });
        if (!user) {
            return res.status(404).json({ message: "Employee not found" });
        }
        const employeeId = getEmployeeId(user) ?? employeeID;
        const profile = user.admin ?? user.manager ?? user.technician ?? user.fieldExecutive ?? user.salesExecutive;
        const bankDetails = user.manager?.bankDetails ??
            user.technician?.bankDetails ??
            user.fieldExecutive?.bankDetails ??
            user.salesExecutive?.bankDetails ??
            null;
        const aadharId = user.manager?.aadharId ??
            user.technician?.aadharId ??
            user.fieldExecutive?.aadharId ??
            user.salesExecutive?.aadharId ??
            null;
        const payload = {
            data: {
                employeeId,
                name: getDisplayName(user),
                position: toUiRole(user.role, user.isAdmin),
                status: toUiStatus(user.status),
                email: user.email,
                phone: user.phone,
                avatar: getImagePayload(user.profileImage),
                personalDetails: {
                    firstName: profile?.firstName ?? null,
                    lastName: profile?.lastName ?? null,
                    aadharId,
                    dateOfJoining: user.dateOfJoining,
                    dateOfTermination: user.dateOfTermination,
                },
                employmentDetails: {
                    salary: user.salary ? String(user.salary) : null,
                    payoutDate: user.payoutDate,
                    storeId: user.storeId,
                    createdBy: user.createdBy,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                },
                bankDetails: {
                    accountNumber: bankDetails?.accountNumber ?? null,
                    ifsc: bankDetails?.ifsc ?? null,
                    bankName: bankDetails?.bankName ?? null,
                    beneficiaryName: bankDetails?.beneficiaryName ?? null,
                    upiId: bankDetails?.upiId ?? null,
                },
                documents: {
                    aadharFront: getImagePayload(user.aadharFrontImage),
                    aadharBack: getImagePayload(user.aadharBackImage),
                    qualification: getImagePayload(user.qualificationImage),
                    agreement: null,
                },
            },
        };
        await writeRouteCache(cacheKey, payload, LIST_TTL_SECONDS);
        return withCachingHeaders(req, res, payload, LIST_TTL_SECONDS);
    }
    catch (error) {
        console.error("team employee details error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
router.get("/stores", async (req, res) => {
    try {
        const page = parsePage(req.query.page);
        const limit = parseLimit(req.query.limit);
        const skip = (page - 1) * limit;
        const search = String(req.query.search ?? "").trim();
        const createdAtRange = typeof req.query.createdAtRange === "string" ? req.query.createdAtRange : undefined;
        const dateStart = getDateRangeStart(createdAtRange);
        const statusFilters = toDbStatuses(parseStringArray(req.query.status));
        const sortBy = typeof req.query.sortBy === "string" ? req.query.sortBy : "createdAt";
        const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";
        const where = { AND: [] };
        const andConditions = where.AND;
        if (search) {
            andConditions.push({
                OR: [
                    { storeName: { contains: search, mode: "insensitive" } },
                    { ownerName: { contains: search, mode: "insensitive" } },
                    { ownerPhone: { contains: search, mode: "insensitive" } },
                    { storeId: { contains: search, mode: "insensitive" } },
                ],
            });
        }
        if (statusFilters.length > 0) {
            andConditions.push({
                user: {
                    is: {
                        status: {
                            in: statusFilters,
                        },
                    },
                },
            });
        }
        if (dateStart) {
            andConditions.push({ createdAt: { gte: dateStart, lte: new Date() } });
        }
        const orderBy = sortBy === "storeName"
            ? { storeName: sortOrder }
            : sortBy === "ownerName"
                ? { ownerName: sortOrder }
                : { createdAt: sortOrder };
        const cacheKey = `team:stores:${JSON.stringify({
            page,
            limit,
            search,
            createdAtRange,
            statusFilters,
            sortBy,
            sortOrder,
        })}`;
        const cached = await readRouteCache(cacheKey);
        if (cached) {
            return withCachingHeaders(req, res, cached, LIST_TTL_SECONDS);
        }
        const [total, stores] = await Promise.all([
            prisma_1.prisma.store.count({ where }),
            prisma_1.prisma.store.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                select: {
                    userId: true,
                    storeId: true,
                    storeName: true,
                    ownerName: true,
                    ownerPhone: true,
                    createdAt: true,
                    address: {
                        select: {
                            streetAddress: true,
                            city: true,
                            state: true,
                            country: true,
                            pinCode: true,
                        },
                    },
                    user: {
                        select: {
                            status: true,
                            profileImage: true,
                        },
                    },
                },
            }),
        ]);
        const payload = {
            items: stores.map((store) => ({
                id: store.userId,
                ownerName: store.ownerName,
                storeId: store.storeId,
                storeName: store.storeName,
                ownerPhone: store.ownerPhone,
                address: store.address
                    ? [
                        store.address.streetAddress,
                        store.address.city,
                        store.address.state,
                        store.address.country,
                        store.address.pinCode,
                    ]
                        .filter(Boolean)
                        .join(", ")
                    : null,
                createdAt: store.createdAt,
                status: toUiStatus(store.user?.status ?? enums_1.UserStatus.ACTIVE),
                avatar: getImagePayload(store.user?.profileImage ?? null),
            })),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
        await writeRouteCache(cacheKey, payload, LIST_TTL_SECONDS);
        return withCachingHeaders(req, res, payload, LIST_TTL_SECONDS);
    }
    catch (error) {
        console.error("team stores error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
router.get("/stores/:storeID", async (req, res) => {
    try {
        const storeID = String(req.params.storeID ?? "").trim();
        if (!storeID) {
            return res.status(400).json({ message: "storeID is required" });
        }
        const cacheKey = `team:store-details:${storeID}`;
        const cached = await readRouteCache(cacheKey);
        if (cached) {
            return withCachingHeaders(req, res, cached, LIST_TTL_SECONDS);
        }
        const store = await prisma_1.prisma.store.findUnique({
            where: { storeId: storeID },
            select: {
                userId: true,
                storeId: true,
                storeName: true,
                ownerName: true,
                ownerPhone: true,
                ownerEmail: true,
                createdAt: true,
                updatedAt: true,
                address: {
                    select: {
                        streetAddress: true,
                        city: true,
                        state: true,
                        country: true,
                        pinCode: true,
                    },
                },
                bankDetails: {
                    select: {
                        accountNumber: true,
                        ifsc: true,
                        bankName: true,
                        beneficiaryName: true,
                        upiId: true,
                    },
                },
                user: {
                    select: {
                        status: true,
                        profileImage: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
            },
        });
        if (!store) {
            return res.status(404).json({ message: "Store not found" });
        }
        const payload = {
            data: {
                storeId: store.storeId,
                storeName: store.storeName,
                ownerName: store.ownerName,
                ownerPhone: store.ownerPhone,
                ownerEmail: store.ownerEmail,
                status: toUiStatus(store.user?.status ?? enums_1.UserStatus.ACTIVE),
                avatar: getImagePayload(store.user?.profileImage ?? null),
                address: {
                    streetAddress: store.address?.streetAddress ?? null,
                    city: store.address?.city ?? null,
                    state: store.address?.state ?? null,
                    country: store.address?.country ?? null,
                    pinCode: store.address?.pinCode ?? null,
                },
                bankDetails: {
                    accountNumber: store.bankDetails?.accountNumber ?? null,
                    ifsc: store.bankDetails?.ifsc ?? null,
                    bankName: store.bankDetails?.bankName ?? null,
                    beneficiaryName: store.bankDetails?.beneficiaryName ?? null,
                    upiId: store.bankDetails?.upiId ?? null,
                },
                meta: {
                    storeDbId: store.userId,
                    storeCreatedAt: store.createdAt,
                    storeUpdatedAt: store.updatedAt,
                    userCreatedAt: store.user?.createdAt ?? null,
                    userUpdatedAt: store.user?.updatedAt ?? null,
                },
            },
        };
        await writeRouteCache(cacheKey, payload, LIST_TTL_SECONDS);
        return withCachingHeaders(req, res, payload, LIST_TTL_SECONDS);
    }
    catch (error) {
        console.error("team store details error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
router.get("/search", async (req, res) => {
    try {
        const query = String(req.query.q ?? "").trim();
        const limit = Math.min(parseLimit(req.query.limit), 20);
        if (query.length < 2) {
            return withCachingHeaders(req, res, { items: [] }, LIST_TTL_SECONDS);
        }
        const employeeBaseWhere = {
            OR: [{ isAdmin: true }, { role: { in: EMPLOYEE_DB_ROLES } }],
        };
        const cacheKey = `team:search:${JSON.stringify({ query, limit })}`;
        const cached = await readRouteCache(cacheKey);
        if (cached) {
            return withCachingHeaders(req, res, cached, LIST_TTL_SECONDS);
        }
        const [users, stores] = await Promise.all([
            prisma_1.prisma.user.findMany({
                where: {
                    AND: [
                        employeeBaseWhere,
                        {
                            OR: [
                                { phone: { contains: query, mode: "insensitive" } },
                                { email: { contains: query, mode: "insensitive" } },
                                { admin: { is: { employeeId: { contains: query, mode: "insensitive" } } } },
                                { admin: { is: { firstName: { contains: query, mode: "insensitive" } } } },
                                { admin: { is: { lastName: { contains: query, mode: "insensitive" } } } },
                                { manager: { is: { employeeId: { contains: query, mode: "insensitive" } } } },
                                { manager: { is: { firstName: { contains: query, mode: "insensitive" } } } },
                                { manager: { is: { lastName: { contains: query, mode: "insensitive" } } } },
                                { technician: { is: { employeeId: { contains: query, mode: "insensitive" } } } },
                                { technician: { is: { firstName: { contains: query, mode: "insensitive" } } } },
                                { technician: { is: { lastName: { contains: query, mode: "insensitive" } } } },
                                { fieldExecutive: { is: { employeeId: { contains: query, mode: "insensitive" } } } },
                                { fieldExecutive: { is: { firstName: { contains: query, mode: "insensitive" } } } },
                                { fieldExecutive: { is: { lastName: { contains: query, mode: "insensitive" } } } },
                                { salesExecutive: { is: { employeeId: { contains: query, mode: "insensitive" } } } },
                                { salesExecutive: { is: { firstName: { contains: query, mode: "insensitive" } } } },
                                { salesExecutive: { is: { lastName: { contains: query, mode: "insensitive" } } } },
                            ],
                        },
                    ],
                },
                select: {
                    phone: true,
                    email: true,
                    role: true,
                    isAdmin: true,
                    admin: { select: { firstName: true, lastName: true, employeeId: true } },
                    manager: { select: { firstName: true, lastName: true, employeeId: true } },
                    technician: { select: { firstName: true, lastName: true, employeeId: true } },
                    fieldExecutive: { select: { firstName: true, lastName: true, employeeId: true } },
                    salesExecutive: { select: { firstName: true, lastName: true, employeeId: true } },
                },
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            prisma_1.prisma.store.findMany({
                where: {
                    OR: [
                        { storeName: { contains: query, mode: "insensitive" } },
                        { ownerName: { contains: query, mode: "insensitive" } },
                        { ownerPhone: { contains: query, mode: "insensitive" } },
                        { storeId: { contains: query, mode: "insensitive" } },
                    ],
                },
                select: {
                    storeId: true,
                    storeName: true,
                    ownerName: true,
                    ownerPhone: true,
                },
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
        ]);
        const employeeItems = users
            .map((user) => {
            const employeeId = getEmployeeId(user);
            if (!employeeId) {
                return null;
            }
            return {
                type: "employee",
                employeeId,
                name: getDisplayName(user),
                role: toUiRole(user.role, user.isAdmin),
                email: user.email,
                phone: user.phone,
            };
        })
            .filter((item) => Boolean(item));
        const storeItems = stores.map((store) => ({
            type: "store",
            storeId: store.storeId,
            storeName: store.storeName,
            ownerName: store.ownerName,
            ownerPhone: store.ownerPhone,
        }));
        const payload = {
            items: [...employeeItems, ...storeItems].slice(0, limit),
        };
        await writeRouteCache(cacheKey, payload, LIST_TTL_SECONDS);
        return withCachingHeaders(req, res, payload, LIST_TTL_SECONDS);
    }
    catch (error) {
        console.error("team search error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
router.get("/filter-options", async (req, res) => {
    try {
        const cacheKey = `team:filter-options`;
        const cached = await readRouteCache(cacheKey);
        if (cached) {
            return withCachingHeaders(req, res, cached, SUMMARY_TTL_SECONDS);
        }
        const employeeBaseWhere = {
            OR: [{ isAdmin: true }, { role: { in: EMPLOYEE_DB_ROLES } }],
        };
        const [roleGroupCounts, adminCount, statusCounts, activeStoreCount, inactiveStoreCount] = await Promise.all([
            prisma_1.prisma.user.groupBy({ by: ["role"], where: employeeBaseWhere, _count: { _all: true } }),
            prisma_1.prisma.user.count({ where: { ...employeeBaseWhere, OR: [{ isAdmin: true }, { role: enums_1.Role.ADMIN }] } }),
            prisma_1.prisma.user.groupBy({ by: ["status"], where: employeeBaseWhere, _count: { _all: true } }),
            prisma_1.prisma.store.count({ where: { user: { is: { status: enums_1.UserStatus.ACTIVE } } } }),
            prisma_1.prisma.store.count({ where: { user: { is: { status: enums_1.UserStatus.INACTIVE } } } }),
        ]);
        const roleMap = roleGroupCounts.reduce((accumulator, item) => {
            if (item.role) {
                accumulator[item.role] = item._count._all;
            }
            return accumulator;
        }, {});
        const statusMap = statusCounts.reduce((accumulator, item) => {
            accumulator[toUiStatus(item.status)] = item._count._all;
            return accumulator;
        }, {});
        const payload = {
            employeeFilters: {
                roles: UI_ROLE_ORDER.map((label) => ({
                    value: label,
                    count: label === "Admin"
                        ? adminCount
                        : label === "Store Manager"
                            ? roleMap[enums_1.Role.MANAGER] ?? 0
                            : label === "Sales Agent"
                                ? roleMap[enums_1.Role.MARKETING_EXECUTIVE] ?? 0
                                : label === "Technician"
                                    ? roleMap[enums_1.Role.TECHNICIAN] ?? 0
                                    : label === "Field Executive"
                                        ? roleMap[enums_1.Role.FIELD_EXECUTIVE] ?? 0
                                        : 0,
                })),
                statuses: [
                    { value: "Active", count: statusMap.Active ?? 0 },
                    { value: "Inactive", count: statusMap.Inactive ?? 0 },
                ],
                createdAtRanges: [
                    { value: "thisWeek", label: "This Week" },
                    { value: "thisMonth", label: "This Month" },
                    { value: "thisYear", label: "This Year" },
                ],
            },
            storeFilters: {
                statuses: [
                    { value: "Active", count: activeStoreCount },
                    { value: "Inactive", count: inactiveStoreCount },
                ],
                createdAtRanges: [
                    { value: "thisWeek", label: "This Week" },
                    { value: "thisMonth", label: "This Month" },
                    { value: "thisYear", label: "This Year" },
                ],
            },
        };
        await writeRouteCache(cacheKey, payload, SUMMARY_TTL_SECONDS);
        return withCachingHeaders(req, res, payload, SUMMARY_TTL_SECONDS);
    }
    catch (error) {
        console.error("team filter-options error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.default = router;

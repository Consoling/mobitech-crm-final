"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const express_1 = __importDefault(require("express"));
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const prisma_1 = require("../config/prisma");
const redis_1 = require("../config/redis");
const enums_1 = require("../generated/prisma/enums");
const env_1 = require("../utils/env");
const router = express_1.default.Router();
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const LIST_TTL_SECONDS = 30;
const SUMMARY_TTL_SECONDS = 60;
const STORE_OPTIONS_TTL_SECONDS = 300;
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
const S3_BUCKET_NAME = env_1.SYS_ENV.AWS_S3_BUCKET_NAME?.trim() ?? "";
const S3_REGION = env_1.SYS_ENV.AWS_REGION?.trim() ?? "";
const S3_PRESIGNED_URL_EXPIRES_IN_SECONDS = Number.isFinite(env_1.SYS_ENV.AWS_S3_PRESIGNED_URL_EXPIRES_IN_SECONDS)
    ? Math.max(60, env_1.SYS_ENV.AWS_S3_PRESIGNED_URL_EXPIRES_IN_SECONDS)
    : 900;
const s3Client = S3_REGION ? new client_s3_1.S3Client({ region: S3_REGION }) : null;
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
    return ([candidate.firstName, candidate.lastName].filter(Boolean).join(" ") ||
        user.phone);
};
const getEmployeeId = (user) => {
    return (user.admin?.employeeId ??
        user.manager?.employeeId ??
        user.technician?.employeeId ??
        user.fieldExecutive?.employeeId ??
        user.salesExecutive?.employeeId ??
        null);
};
const getImagePayload = async (key) => {
    if (!key) {
        return null;
    }
    if (s3Client && S3_BUCKET_NAME) {
        try {
            const url = await (0, s3_request_presigner_1.getSignedUrl)(s3Client, new client_s3_1.GetObjectCommand({
                Bucket: S3_BUCKET_NAME,
                Key: key,
            }), { expiresIn: S3_PRESIGNED_URL_EXPIRES_IN_SECONDS });
            return {
                key,
                url,
            };
        }
        catch (error) {
            console.error("team image url signing error:", error);
        }
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
            prisma_1.prisma.user.count({
                where: { ...employeeBaseWhere, status: enums_1.UserStatus.ACTIVE },
            }),
            prisma_1.prisma.user.count({
                where: { ...employeeBaseWhere, status: enums_1.UserStatus.INACTIVE },
            }),
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
        const createdAtRange = typeof req.query.createdAtRange === "string"
            ? req.query.createdAtRange
            : undefined;
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
                    {
                        admin: {
                            is: { employeeId: { contains: search, mode: "insensitive" } },
                        },
                    },
                    {
                        admin: {
                            is: { firstName: { contains: search, mode: "insensitive" } },
                        },
                    },
                    {
                        admin: {
                            is: { lastName: { contains: search, mode: "insensitive" } },
                        },
                    },
                    {
                        manager: {
                            is: { employeeId: { contains: search, mode: "insensitive" } },
                        },
                    },
                    {
                        manager: {
                            is: { firstName: { contains: search, mode: "insensitive" } },
                        },
                    },
                    {
                        manager: {
                            is: { lastName: { contains: search, mode: "insensitive" } },
                        },
                    },
                    {
                        technician: {
                            is: { employeeId: { contains: search, mode: "insensitive" } },
                        },
                    },
                    {
                        technician: {
                            is: { firstName: { contains: search, mode: "insensitive" } },
                        },
                    },
                    {
                        technician: {
                            is: { lastName: { contains: search, mode: "insensitive" } },
                        },
                    },
                    {
                        fieldExecutive: {
                            is: { employeeId: { contains: search, mode: "insensitive" } },
                        },
                    },
                    {
                        fieldExecutive: {
                            is: { firstName: { contains: search, mode: "insensitive" } },
                        },
                    },
                    {
                        fieldExecutive: {
                            is: { lastName: { contains: search, mode: "insensitive" } },
                        },
                    },
                    {
                        salesExecutive: {
                            is: { employeeId: { contains: search, mode: "insensitive" } },
                        },
                    },
                    {
                        salesExecutive: {
                            is: { firstName: { contains: search, mode: "insensitive" } },
                        },
                    },
                    {
                        salesExecutive: {
                            is: { lastName: { contains: search, mode: "insensitive" } },
                        },
                    },
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
                    dateOfBirth: true,
                    dateOfTermination: true,
                    profileImage: true,
                    admin: {
                        select: { firstName: true, lastName: true, employeeId: true },
                    },
                    manager: {
                        select: { firstName: true, lastName: true, employeeId: true },
                    },
                    technician: {
                        select: { firstName: true, lastName: true, employeeId: true },
                    },
                    fieldExecutive: {
                        select: { firstName: true, lastName: true, employeeId: true },
                    },
                    salesExecutive: {
                        select: { firstName: true, lastName: true, employeeId: true },
                    },
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
            items: await Promise.all(users.map(async (user) => ({
                id: user.id,
                name: getDisplayName(user),
                email: user.email,
                employeeId: getEmployeeId(user),
                phone: user.phone,
                createdAt: user.createdAt,
                role: toUiRole(user.role, user.isAdmin),
                status: toUiStatus(user.status),
                avatar: await getImagePayload(user.profileImage),
            }))),
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
                dateOfBirth: true,
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
        const profile = user.admin ??
            user.manager ??
            user.technician ??
            user.fieldExecutive ??
            user.salesExecutive;
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
        const [avatar, aadharFront, aadharBack, qualification] = await Promise.all([
            getImagePayload(user.profileImage),
            getImagePayload(user.aadharFrontImage),
            getImagePayload(user.aadharBackImage),
            getImagePayload(user.qualificationImage),
        ]);
        const payload = {
            data: {
                employeeId,
                name: getDisplayName(user),
                position: toUiRole(user.role, user.isAdmin),
                status: toUiStatus(user.status),
                email: user.email,
                phone: user.phone,
                avatar,
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
                    aadharFront,
                    aadharBack,
                    qualification,
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
        const createdAtRange = typeof req.query.createdAtRange === "string"
            ? req.query.createdAtRange
            : undefined;
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
            items: await Promise.all(stores.map(async (store) => ({
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
                avatar: await getImagePayload(store.user?.profileImage ?? null),
            }))),
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
router.get("/stores/options", async (req, res) => {
    try {
        const search = String(req.query.search ?? "").trim();
        const limit = Math.min(parseLimit(req.query.limit), 500);
        const cacheKey = `team:store-options:${JSON.stringify({
            search,
            limit,
        })}`;
        const cached = await readRouteCache(cacheKey);
        if (cached) {
            return withCachingHeaders(req, res, cached, STORE_OPTIONS_TTL_SECONDS);
        }
        const where = {};
        if (search) {
            where.OR = [
                { storeName: { contains: search, mode: "insensitive" } },
                { storeId: { contains: search, mode: "insensitive" } },
                { ownerName: { contains: search, mode: "insensitive" } },
            ];
        }
        const stores = await prisma_1.prisma.store.findMany({
            where,
            take: limit,
            orderBy: { storeName: "asc" },
            select: {
                storeId: true,
                storeName: true,
            },
        });
        const payload = {
            items: stores.map((store) => ({
                value: store.storeId,
                label: store.storeName,
            })),
        };
        await writeRouteCache(cacheKey, payload, STORE_OPTIONS_TTL_SECONDS);
        return withCachingHeaders(req, res, payload, STORE_OPTIONS_TTL_SECONDS);
    }
    catch (error) {
        console.error("team store options error:", error);
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
        const avatar = await getImagePayload(store.user?.profileImage ?? null);
        const payload = {
            data: {
                storeId: store.storeId,
                storeName: store.storeName,
                ownerName: store.ownerName,
                ownerPhone: store.ownerPhone,
                ownerEmail: store.ownerEmail,
                status: toUiStatus(store.user?.status ?? enums_1.UserStatus.ACTIVE),
                avatar,
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
                                {
                                    admin: {
                                        is: {
                                            employeeId: { contains: query, mode: "insensitive" },
                                        },
                                    },
                                },
                                {
                                    admin: {
                                        is: { firstName: { contains: query, mode: "insensitive" } },
                                    },
                                },
                                {
                                    admin: {
                                        is: { lastName: { contains: query, mode: "insensitive" } },
                                    },
                                },
                                {
                                    manager: {
                                        is: {
                                            employeeId: { contains: query, mode: "insensitive" },
                                        },
                                    },
                                },
                                {
                                    manager: {
                                        is: { firstName: { contains: query, mode: "insensitive" } },
                                    },
                                },
                                {
                                    manager: {
                                        is: { lastName: { contains: query, mode: "insensitive" } },
                                    },
                                },
                                {
                                    technician: {
                                        is: {
                                            employeeId: { contains: query, mode: "insensitive" },
                                        },
                                    },
                                },
                                {
                                    technician: {
                                        is: { firstName: { contains: query, mode: "insensitive" } },
                                    },
                                },
                                {
                                    technician: {
                                        is: { lastName: { contains: query, mode: "insensitive" } },
                                    },
                                },
                                {
                                    fieldExecutive: {
                                        is: {
                                            employeeId: { contains: query, mode: "insensitive" },
                                        },
                                    },
                                },
                                {
                                    fieldExecutive: {
                                        is: { firstName: { contains: query, mode: "insensitive" } },
                                    },
                                },
                                {
                                    fieldExecutive: {
                                        is: { lastName: { contains: query, mode: "insensitive" } },
                                    },
                                },
                                {
                                    salesExecutive: {
                                        is: {
                                            employeeId: { contains: query, mode: "insensitive" },
                                        },
                                    },
                                },
                                {
                                    salesExecutive: {
                                        is: { firstName: { contains: query, mode: "insensitive" } },
                                    },
                                },
                                {
                                    salesExecutive: {
                                        is: { lastName: { contains: query, mode: "insensitive" } },
                                    },
                                },
                            ],
                        },
                    ],
                },
                select: {
                    phone: true,
                    email: true,
                    role: true,
                    isAdmin: true,
                    admin: {
                        select: { firstName: true, lastName: true, employeeId: true },
                    },
                    manager: {
                        select: { firstName: true, lastName: true, employeeId: true },
                    },
                    technician: {
                        select: { firstName: true, lastName: true, employeeId: true },
                    },
                    fieldExecutive: {
                        select: { firstName: true, lastName: true, employeeId: true },
                    },
                    salesExecutive: {
                        select: { firstName: true, lastName: true, employeeId: true },
                    },
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
        const [roleGroupCounts, adminCount, statusCounts, activeStoreCount, inactiveStoreCount,] = await Promise.all([
            prisma_1.prisma.user.groupBy({
                by: ["role"],
                where: employeeBaseWhere,
                _count: { _all: true },
            }),
            prisma_1.prisma.user.count({
                where: {
                    ...employeeBaseWhere,
                    OR: [{ isAdmin: true }, { role: enums_1.Role.ADMIN }],
                },
            }),
            prisma_1.prisma.user.groupBy({
                by: ["status"],
                where: employeeBaseWhere,
                _count: { _all: true },
            }),
            prisma_1.prisma.store.count({
                where: { user: { is: { status: enums_1.UserStatus.ACTIVE } } },
            }),
            prisma_1.prisma.store.count({
                where: { user: { is: { status: enums_1.UserStatus.INACTIVE } } },
            }),
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
                            ? (roleMap[enums_1.Role.MANAGER] ?? 0)
                            : label === "Sales Agent"
                                ? (roleMap[enums_1.Role.MARKETING_EXECUTIVE] ?? 0)
                                : label === "Technician"
                                    ? (roleMap[enums_1.Role.TECHNICIAN] ?? 0)
                                    : label === "Field Executive"
                                        ? (roleMap[enums_1.Role.FIELD_EXECUTIVE] ?? 0)
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
router.post(`/add-employee/send-otp`, async (req, res) => {
    try {
        const { identifier } = req.body;
        if (!identifier) {
            return res.status(400).json({ message: "Identifier is required" });
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // OTP valid for 5 minutes
        await prisma_1.prisma.otp.create({
            data: {
                identifier,
                otp,
                expiresAt,
            },
        });
        const whatsappUrl = `https://www.fast2sms.com/dev/whatsapp?authorization=${env_1.SYS_ENV.FAST2SMS_API_KEY}&message_id=4131&numbers=${identifier}&variables_values=${otp}`;
        let response1, response2;
        try {
            response1 = await fetch(whatsappUrl, { method: "GET" });
        }
        catch (err) {
            response1 = { ok: false };
        }
        if (response1 && response1.ok) {
            return res.status(200).json({
                success: true,
                message: "OTP sent on WhatsApp",
                medium: "whatsapp",
            });
        }
        response2 = await fetch(`${env_1.SYS_ENV.FAST2SMS_API_ENDPOINT}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                authorization: env_1.SYS_ENV.FAST2SMS_API_KEY,
            },
            body: JSON.stringify({
                route: "q",
                numbers: identifier,
                language: "english",
                message: `Dear Employee, ${otp} is the OTP for your registration. Please DO NOT SHARE this with anyone. Team Mobitech`,
            }),
        });
        if (response2.ok) {
            return res.status(200).json({
                success: true,
                message: "OTP sent via SMS",
                medium: "sms",
            });
        }
        else {
            const errorText = await response2.text();
            console.error("Fast2SMS Error:", errorText);
            return res.status(500).json({
                success: false,
                error: "Failed to send OTP via WhatsApp and SMS",
            });
        }
    }
    catch (error) {
        console.error("Error sending OTP:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
router.post(`/add-employee/verify-otp`, async (req, res) => {
    try {
        const { identifier, otp } = req.body;
        if (!identifier || !otp) {
            return res
                .status(400)
                .json({ message: "Identifier and OTP are required" });
        }
        const record = await prisma_1.prisma.otp.findFirst({
            where: {
                identifier,
                otp,
                used: false,
                expiresAt: {
                    gte: new Date(),
                },
            },
        });
        if (!record) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }
        await prisma_1.prisma.otp.update({
            where: { id: record.id },
            data: { used: true },
        });
        return res.status(200).json({ message: "OTP verified successfully" });
    }
    catch (error) {
        console.error("Error verifying OTP:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
router.post(`/add-employee/get-aadhar-otp`, async (req, res) => {
    try {
        const { aadharId } = req.body;
        if (!aadharId) {
            return res.status(400).json({ message: "Aadhar ID is required" });
        }
        const response = await fetch("https://api.quickekyc.com/api/v1/aadhaar-v2/generate-otp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                key: env_1.SYS_ENV.QUICKEKYC_KEY,
                id_number: aadharId,
            }),
        });
        console.log("QuickKYC OTP Response Status:", response.status);
        const data = await response.json();
        return res.status(200).json(data);
    }
    catch (error) {
        console.error("Error sending Aadhar OTP:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
router.post(`/add-employee/verify-aadhar-otp`, async (req, res) => {
    try {
        const { request_id, otp } = req.body;
        if (!request_id || !otp) {
            return res
                .status(400)
                .json({ message: "Request ID and OTP are required" });
        }
        const response = await fetch("https://api.quickekyc.com/api/v1/aadhaar-v2/submit-otp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                key: env_1.SYS_ENV.QUICKEKYC_KEY,
                request_id,
                otp,
            }),
        });
        const data = await response.json();
        return res.status(200).json(data);
    }
    catch (error) {
        console.error("Error verifying Aadhar OTP:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
router.post(`/add-employee/verify-upi`, async (req, res) => {
    try {
        const { upi_id } = req.body;
        if (!upi_id) {
            return res.status(400).json({ message: "UPI ID is required" });
        }
        const response = await fetch("https://api.quickekyc.com/api/v1/bank-verification/upi-verification", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                key: env_1.SYS_ENV.QUICKEKYC_KEY,
                upi_id,
            }),
        });
        const data = await response.json();
        return res.status(200).json(data);
    }
    catch (error) {
        console.error("Error verifying UPI:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
router.post(`/add-employee/verify-bank`, async (req, res) => {
    try {
        const { id_number, ifsc } = req.body;
        if (!id_number || !ifsc) {
            return res.status(400).json({ message: "ID Number and IFSC are required" });
        }
        const response = await fetch("https://api.quickekyc.com/api/v1/bank-verification", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                key: env_1.SYS_ENV.QUICKEKYC_KEY,
                id_number,
                ifsc,
            }),
        });
        const data = await response.json();
        return res.status(200).json(data);
    }
    catch (error) {
        console.error("Error verifying bank details:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.default = router;

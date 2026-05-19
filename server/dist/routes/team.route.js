"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importStar(require("crypto"));
const express_1 = __importDefault(require("express"));
const bcrypt_1 = require("bcrypt");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const prisma_1 = require("../config/prisma");
const redis_1 = require("../config/redis");
const enums_1 = require("../generated/prisma/enums");
const env_1 = require("../utils/env");
const s3_1 = require("../utils/s3");
const id_gen_1 = require("../utils/id-gen");
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
const TEMP_UPLOAD_FIELDS = new Set([
    "profilePicture",
    "aadharFront",
    "aadharBack",
    "contractDocument",
    "qualificationDocument",
    "vehicleImageFront",
    "vehicleImageBack",
]);
const TEMP_UPLOAD_CONTENT_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "application/pdf",
]);
const TEMP_UPLOAD_MAX_SIZE_BYTES = 10 * 1024 * 1024;
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
const getExtensionFromUpload = (fileName, contentType) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    if (extension && /^[a-z0-9]{1,8}$/.test(extension)) {
        return extension;
    }
    if (contentType === "image/jpeg") {
        return "jpg";
    }
    if (contentType === "image/png") {
        return "png";
    }
    if (contentType === "application/pdf") {
        return "pdf";
    }
    return "bin";
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
    if (status === enums_1.UserStatus.ACTIVE) {
        return "Active";
    }
    if (status === enums_1.UserStatus.INACTIVE) {
        return "Inactive";
    }
    if (status === enums_1.UserStatus.TERMINATED) {
        return "Terminated";
    }
    return "Inactive";
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
    // Prefer CDN URL if available (avoids S3 permission/signature issues)
    if (CDN_BASE_URL) {
        return {
            key,
            url: `${CDN_BASE_URL}/${key}`,
        };
    }
    // Fall back to presigned S3 URL if CDN not configured
    if (s3_1.s3Client && S3_BUCKET_NAME) {
        try {
            const url = await (0, s3_request_presigner_1.getSignedUrl)(s3_1.s3Client, new client_s3_1.GetObjectCommand({
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
        url: null,
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
                where: { ...employeeBaseWhere, status: { in: [enums_1.UserStatus.INACTIVE, enums_1.UserStatus.TERMINATED] } },
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
        // console.log("Team summary payload:", payload);
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
        // console.log("QuickKYC OTP Response Status:", response.status);
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
            return res
                .status(400)
                .json({ message: "ID Number and IFSC are required" });
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
router.post(`/uploads/presign-temp`, async (req, res) => {
    try {
        if (!s3_1.s3Client || !S3_BUCKET_NAME) {
            return res.status(500).json({ message: "S3 is not configured" });
        }
        const { field, fileName, contentType, size } = req.body;
        if (!field || !TEMP_UPLOAD_FIELDS.has(field)) {
            return res.status(400).json({ message: "Invalid upload field" });
        }
        if (!fileName || typeof fileName !== "string") {
            return res.status(400).json({ message: "fileName is required" });
        }
        if (!contentType || !TEMP_UPLOAD_CONTENT_TYPES.has(contentType)) {
            return res.status(400).json({ message: "Unsupported file type" });
        }
        const parsedSize = Number(size);
        if (!Number.isFinite(parsedSize) ||
            parsedSize <= 0 ||
            parsedSize > TEMP_UPLOAD_MAX_SIZE_BYTES) {
            return res.status(400).json({ message: "Invalid file size" });
        }
        const draftId = crypto_1.default.randomUUID();
        const fileId = crypto_1.default.randomUUID();
        const extension = getExtensionFromUpload(fileName, contentType);
        const key = `temp/add-employee/${draftId}/${field}-${fileId}.${extension}`;
        const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3_1.s3Client, new client_s3_1.PutObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: key,
            ContentType: contentType,
            Metadata: {
                originalFileName: fileName.slice(0, 200),
                uploadField: field,
            },
        }), { expiresIn: S3_PRESIGNED_URL_EXPIRES_IN_SECONDS });
        return res.status(200).json({
            uploadUrl,
            key,
            expiresIn: S3_PRESIGNED_URL_EXPIRES_IN_SECONDS,
        });
    }
    catch (error) {
        console.error("Error generating presigned URL:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
router.post(`/disable-employee`, async (req, res) => {
    try {
        const { employeeEncID } = req.body;
        if (!employeeEncID) {
            return res.status(400).json({ message: "employeeEncID is required" });
        }
        const user = await prisma_1.prisma.user.findFirst({
            where: {
                id: employeeEncID,
            },
        });
        if (!user) {
            return res.status(404).json({ message: "Employee not found" });
        }
        await prisma_1.prisma.user.update({
            where: {
                id: employeeEncID,
            },
            data: {
                status: enums_1.UserStatus.INACTIVE,
            },
        });
        return res.status(200).json({ message: "Employee disabled successfully" });
    }
    catch (error) {
        console.error("Error disabling employee:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
router.post(`/enable-employee`, async (req, res) => {
    try {
        const { employeeEncID } = req.body;
        if (!employeeEncID) {
            return res.status(400).json({ message: "employeeEncID is required" });
        }
        const user = await prisma_1.prisma.user.findFirst({
            where: {
                id: employeeEncID,
            },
        });
        if (!user) {
            return res.status(404).json({ message: "Employee not found" });
        }
        await prisma_1.prisma.user.update({
            where: {
                id: employeeEncID,
            },
            data: {
                status: enums_1.UserStatus.ACTIVE,
                dateOfTermination: null,
            },
        });
        return res.status(200).json({ message: "Employee enabled successfully" });
    }
    catch (error) {
        console.error("Error enabling employee:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
router.post(`/terminate-employee`, async (req, res) => {
    try {
        const { employeeEncID } = req.body;
        if (!employeeEncID) {
            return res.status(400).json({ message: "employeeEncID is required" });
        }
        const user = await prisma_1.prisma.user.findFirst({
            where: {
                id: employeeEncID,
            },
        });
        if (!user) {
            return res.status(404).json({ message: "Employee not found" });
        }
        await prisma_1.prisma.user.update({
            where: {
                id: employeeEncID,
            },
            data: {
                status: enums_1.UserStatus.TERMINATED,
                dateOfTermination: new Date(),
            },
        });
        return res
            .status(200)
            .json({ message: "Employee terminated successfully" });
    }
    catch (error) {
        console.error("Error terminating employee:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
const generateId = async () => {
    const prefix = "MT";
    const random = Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, "0");
    const id = `${prefix}${random}`;
    // Check if ID exists
    const exists = await prisma_1.prisma.user.findFirst({
        where: {
            OR: [
                { manager: { employeeId: id } },
                { technician: { employeeId: id } },
                { fieldExecutive: { employeeId: id } },
                { salesExecutive: { employeeId: id } },
            ],
        },
    });
    // If ID exists, generate a new one
    if (exists) {
        return generateId();
    }
    return id;
};
router.post(`/add-employee`, async (req, res) => {
    try {
        const body = req.body ?? {};
        const phone = String(body.phone ?? "").trim();
        const phoneVerified = Boolean(body.isPhoneVerified);
        const salary = body.salary !== undefined && body.salary !== ""
            ? Number(body.salary)
            : null;
        const payoutDate = body.payoutDate !== undefined && body.payoutDate !== ""
            ? Number(body.payoutDate)
            : null;
        const password = String(body.password ?? "");
        const email = body.email ? String(body.email).trim() : null;
        const dob = body.aadharData ? new Date(String(body.aadharData.dob)) : null;
        const doj = body.dateOfJoining
            ? new Date(String(body.dateOfJoining))
            : null;
        const roleStr = String(body.role ?? "").trim();
        const storeId = body.storeId ? String(body.storeId).trim() : null;
        const firstName = String(body.firstName ?? "").trim();
        const lastName = String(body.lastName ?? "").trim();
        const aadharNumber = body.aadharData && body.aadharData.aadhaar_number
            ? String(body.aadharData.aadhaar_number).trim()
            : null;
        if (!phone || !password) {
            return res
                .status(400)
                .json({ message: "Phone and password are required" });
        }
        // Check duplicate phone
        const existing = await prisma_1.prisma.user.findUnique({ where: { phone } });
        if (existing) {
            return res
                .status(400)
                .json({ message: "User with this phone already exists" });
        }
        // Map role string to enum
        const roleMap = {
            admin: enums_1.Role.ADMIN,
            "store-manager": enums_1.Role.MANAGER,
            "sales-agent": enums_1.Role.MARKETING_EXECUTIVE,
            technician: enums_1.Role.TECHNICIAN,
            "field-executive": enums_1.Role.FIELD_EXECUTIVE,
        };
        const roleEnum = roleMap[roleStr] ?? null;
        const hashed = await (0, bcrypt_1.hash)(password, 10);
        // Generate employeeId early so we can use it for final S3 paths
        const employeeId = await generateId();
        // Map temp keys to final keys and copy files in S3
        const tempToFinalMapping = {
            profilePicture: "profileImage",
            aadharFront: "aadharFrontImage",
            aadharBack: "aadharBackImage",
            qualificationDocument: "qualificationImage",
            vehicleImageFront: "VehicleFrontImage",
            vehicleImageBack: "VehicleBackImage",
            contractDocument: "contractDocument", // Store but not mapped to User model
        };
        const userCreateData = {
            phone,
            phoneVerified: phoneVerified,
            salary,
            payoutDate,
            password: hashed,
            email: email || null,
            dateOfBirth: dob,
            dateOfJoining: doj,
            isAdmin: roleEnum === enums_1.Role.ADMIN,
            role: roleEnum,
            storeId: storeId || null,
        };
        const bankName = body.bankName ? String(body.bankName).trim() : null;
        const accountNumber = body.accountNumber
            ? String(body.accountNumber).trim()
            : null;
        const ifscCode = body.ifscCode ? String(body.ifscCode).trim() : null;
        const beneficiaryName = body.beneficiaryName
            ? String(body.beneficiaryName).trim()
            : null;
        const upiId = body.upiId ? String(body.upiId).trim() : null;
        const bankDetailsPayload = {
            accountNumber: accountNumber || null,
            ifsc: ifscCode || null,
            bankName: bankName || null,
            beneficiaryName: beneficiaryName || null,
            upiId: upiId || null,
        };
        switch (roleEnum) {
            case enums_1.Role.MANAGER:
                userCreateData.manager = {
                    create: {
                        employeeId,
                        firstName,
                        lastName,
                        aadharId: aadharNumber,
                        bankDetails: {
                            create: bankDetailsPayload
                        }
                    },
                };
                break;
            case enums_1.Role.TECHNICIAN:
                userCreateData.technician = {
                    create: {
                        employeeId,
                        firstName,
                        lastName,
                        aadharId: aadharNumber,
                        bankDetails: {
                            create: bankDetailsPayload
                        }
                    },
                };
                break;
            case enums_1.Role.FIELD_EXECUTIVE:
                userCreateData.fieldExecutive = {
                    create: {
                        employeeId,
                        firstName,
                        lastName,
                        aadharId: aadharNumber,
                        bankDetails: {
                            create: bankDetailsPayload
                        }
                    },
                };
                break;
            case enums_1.Role.MARKETING_EXECUTIVE:
                userCreateData.salesExecutive = {
                    create: {
                        employeeId,
                        firstName,
                        lastName,
                        aadharId: aadharNumber,
                        bankDetails: {
                            create: bankDetailsPayload
                        }
                    },
                };
                break;
        }
        // Copy files from temp to final in S3, update userCreateData with final keys
        const tempFilesToDelete = [];
        for (const [fieldName, dbFieldName] of Object.entries(tempToFinalMapping)) {
            const tempKey = body[fieldName]?.key;
            if (!tempKey)
                continue;
            if (s3_1.s3Client && S3_BUCKET_NAME) {
                try {
                    const ext = tempKey.split(".").pop();
                    const finalKey = `final/${Date.now()}-${(0, crypto_1.randomUUID)()}.${ext}`;
                    // Copy from temp to final
                    await s3_1.s3Client.send(new client_s3_1.CopyObjectCommand({
                        Bucket: S3_BUCKET_NAME,
                        CopySource: `${S3_BUCKET_NAME}/${tempKey}`,
                        Key: finalKey,
                    }));
                    userCreateData[dbFieldName] = finalKey;
                    tempFilesToDelete.push(tempKey);
                }
                catch (error) {
                    console.error(`Error copying ${tempKey}:`, error);
                    throw new Error(`Failed to copy file ${fieldName} to final storage`);
                }
            }
        }
        // create user with final keys
        const created = await prisma_1.prisma.user.create({ data: userCreateData });
        // Clean up temp files after successful user creation
        if (s3_1.s3Client && S3_BUCKET_NAME) {
            for (const tempKey of tempFilesToDelete) {
                try {
                    await s3_1.s3Client.send(new client_s3_1.DeleteObjectCommand({
                        Bucket: S3_BUCKET_NAME,
                        Key: tempKey,
                    }));
                }
                catch (error) {
                    console.error(`Error deleting temp file ${tempKey}:`, error);
                    // Don't throw - deletion failure shouldn't fail the request
                }
            }
        }
        // Create admin/detail records when possible
        // IMPORTANT: Must create role records BEFORE BankDetails due to FK constraints
        // Track which role record was created so we only reference it in BankDetails if it exists
        let roleRecordCreated = false;
        if (roleEnum === enums_1.Role.ADMIN) {
            await prisma_1.prisma.admin.create({
                data: {
                    userId: created.id,
                    employeeId,
                    firstName: firstName || null,
                    lastName: lastName || null,
                },
            });
            roleRecordCreated = true;
        }
        if (roleRecordCreated &&
            (bankName || accountNumber || ifscCode || beneficiaryName || upiId)) {
            await prisma_1.prisma.bankDetails.create({
                data: {
                    bankName: bankName || null,
                    accountNumber: accountNumber || null,
                    ifsc: ifscCode || null,
                    beneficiaryName: beneficiaryName || null,
                    upiId: upiId || null,
                    managerId: roleEnum === enums_1.Role.MANAGER ? created.id : undefined,
                    technicianId: roleEnum === enums_1.Role.TECHNICIAN ? created.id : undefined,
                    fieldExecId: roleEnum === enums_1.Role.FIELD_EXECUTIVE ? created.id : undefined,
                    salesExecId: roleEnum === enums_1.Role.MARKETING_EXECUTIVE ? created.id : undefined,
                },
            });
        }
        return res.status(201).json({
            success: true,
            user: {
                id: created.id,
                phone: created.phone,
                email: created.email,
                role: created.role,
                createdAt: created.createdAt,
            },
            employeeId,
        });
    }
    catch (error) {
        console.error("add-employee error:", error);
        // handle unique constraint
        if (error?.code === "P2002") {
            return res
                .status(400)
                .json({ message: "Duplicate value violates unique constraint" });
        }
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
router.post(`/check-phone`, async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).json({ message: "Phone number is required" });
        }
        const existing = await prisma_1.prisma.user.findUnique({ where: { phone } });
        return res.status(200).json({
            message: {
                exists: Boolean(existing),
            },
        });
    }
    catch (error) {
        console.error("check-phone error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
router.put(`/employees/:employeeId`, async (req, res) => {
    try {
        const { employeeId } = req.params;
        if (!employeeId) {
            return res.status(400).json({ message: "employeeId is required" });
        }
        // Find the user by employeeId in any role table
        const user = await prisma_1.prisma.user.findFirst({
            where: {
                OR: [
                    { manager: { employeeId } },
                    { technician: { employeeId } },
                    { fieldExecutive: { employeeId } },
                    { salesExecutive: { employeeId } },
                    { admin: { employeeId } },
                ],
            },
        });
        if (!user) {
            return res.status(404).json({ message: "Employee not found" });
        }
        const body = req.body ?? {};
        const firstName = body.firstName ? String(body.firstName).trim() : undefined;
        const lastName = body.lastName ? String(body.lastName).trim() : undefined;
        const aadharId = body.aadharId ? String(body.aadharId).trim() : undefined;
        const email = body.email ? String(body.email).trim() : undefined;
        const phone = body.phone ? String(body.phone).trim() : undefined;
        const isPhoneVerified = Boolean(body.isPhoneVerified);
        const salary = body.salary !== undefined && body.salary !== ""
            ? Number(body.salary)
            : undefined;
        const payoutDate = body.payoutDate !== undefined && body.payoutDate !== ""
            ? Number(body.payoutDate)
            : undefined;
        const storeId = body.storeId ? String(body.storeId).trim() : undefined;
        const dateOfJoining = body.dateOfJoining
            ? new Date(String(body.dateOfJoining))
            : undefined;
        const dateOfTermination = body.dateOfTermination
            ? new Date(String(body.dateOfTermination))
            : undefined;
        const bankName = body.bankName ? String(body.bankName).trim() : undefined;
        const accountNumber = body.accountNumber
            ? String(body.accountNumber).trim()
            : undefined;
        const ifsc = body.ifsc ? String(body.ifsc).trim() : undefined;
        const beneficiaryName = body.beneficiaryName
            ? String(body.beneficiaryName).trim()
            : undefined;
        const upiId = body.upiId ? String(body.upiId).trim() : undefined;
        // Update user core fields
        const userUpdateData = {};
        if (email !== undefined)
            userUpdateData.email = email || null;
        if (phone !== undefined) {
            userUpdateData.phone = phone;
            userUpdateData.phoneVerified = Boolean(isPhoneVerified);
        }
        if (salary !== undefined)
            userUpdateData.salary = salary;
        if (payoutDate !== undefined)
            userUpdateData.payoutDate = payoutDate;
        if (storeId !== undefined)
            userUpdateData.storeId = storeId || null;
        if (dateOfJoining !== undefined)
            userUpdateData.dateOfJoining = dateOfJoining || null;
        if (dateOfTermination !== undefined)
            userUpdateData.dateOfTermination = dateOfTermination || null;
        await prisma_1.prisma.user.update({ where: { id: user.id }, data: userUpdateData });
        // Upsert role-specific record(s). Ensure role records exist so BankDetails FK can reference them.
        // Admin
        if (body.role === "admin" || body.isAdmin) {
            await prisma_1.prisma.admin.upsert({
                where: { userId: user.id },
                create: {
                    userId: user.id,
                    employeeId,
                    firstName: firstName || null,
                    lastName: lastName || null,
                },
                update: {
                    firstName: firstName || undefined,
                    lastName: lastName || undefined,
                },
            });
        }
        // Manager
        if (user.role === enums_1.Role.MANAGER || body.role === "store-manager") {
            await prisma_1.prisma.manager.upsert({
                where: { userId: user.id },
                create: {
                    userId: user.id,
                    employeeId,
                    firstName: firstName || "",
                    lastName: lastName || "",
                    aadharId: aadharId || `NA-${employeeId}-MANAGER`,
                },
                update: {
                    firstName: firstName || undefined,
                    lastName: lastName || undefined,
                    aadharId: aadharId || undefined,
                },
            });
        }
        // Technician
        if (user.role === enums_1.Role.TECHNICIAN || body.role === "technician") {
            await prisma_1.prisma.technician.upsert({
                where: { userId: user.id },
                create: {
                    userId: user.id,
                    employeeId,
                    firstName: firstName || "",
                    lastName: lastName || "",
                    aadharId: aadharId || `NA-${employeeId}-TECHNICIAN`,
                },
                update: {
                    firstName: firstName || undefined,
                    lastName: lastName || undefined,
                    aadharId: aadharId || undefined,
                },
            });
        }
        // Field Executive
        if (user.role === enums_1.Role.FIELD_EXECUTIVE || body.role === "field-executive") {
            await prisma_1.prisma.fieldExecutive.upsert({
                where: { userId: user.id },
                create: {
                    userId: user.id,
                    employeeId,
                    firstName: firstName || "",
                    lastName: lastName || "",
                    aadharId: aadharId || `NA-${employeeId}-FIELD`,
                },
                update: {
                    firstName: firstName || undefined,
                    lastName: lastName || undefined,
                    aadharId: aadharId || undefined,
                },
            });
        }
        // Sales Executive
        if (user.role === enums_1.Role.MARKETING_EXECUTIVE ||
            body.role === "sales-agent") {
            await prisma_1.prisma.salesExecutive.upsert({
                where: { userId: user.id },
                create: {
                    userId: user.id,
                    employeeId,
                    firstName: firstName || "",
                    lastName: lastName || "",
                    aadharId: aadharId || `NA-${employeeId}-SALES`,
                },
                update: {
                    firstName: firstName || undefined,
                    lastName: lastName || undefined,
                    aadharId: aadharId || undefined,
                },
            });
        }
        // Upsert BankDetails: find existing by any role link and update, otherwise create
        const existingBank = await prisma_1.prisma.bankDetails.findFirst({
            where: {
                OR: [
                    { managerId: user.id },
                    { technicianId: user.id },
                    { fieldExecId: user.id },
                    { salesExecId: user.id },
                    { storeId: user.id },
                ],
            },
        });
        const bankPayload = {};
        if (bankName !== undefined)
            bankPayload.bankName = bankName || null;
        if (accountNumber !== undefined)
            bankPayload.accountNumber = accountNumber || null;
        if (ifsc !== undefined)
            bankPayload.ifsc = ifsc || null;
        if (beneficiaryName !== undefined)
            bankPayload.beneficiaryName = beneficiaryName || null;
        if (upiId !== undefined)
            bankPayload.upiId = upiId || null;
        if (bankName !== undefined ||
            accountNumber !== undefined ||
            ifsc !== undefined ||
            beneficiaryName !== undefined ||
            upiId !== undefined) {
            if (existingBank) {
                await prisma_1.prisma.bankDetails.update({
                    where: { id: existingBank.id },
                    data: bankPayload,
                });
            }
            else {
                // attach to the correct role column based on user's role
                const createData = { ...bankPayload };
                if (user.role === enums_1.Role.MANAGER)
                    createData.managerId = user.id;
                else if (user.role === enums_1.Role.TECHNICIAN)
                    createData.technicianId = user.id;
                else if (user.role === enums_1.Role.FIELD_EXECUTIVE)
                    createData.fieldExecId = user.id;
                else if (user.role === enums_1.Role.MARKETING_EXECUTIVE)
                    createData.salesExecId = user.id;
                else
                    createData.managerId = user.id; // fallback
                await prisma_1.prisma.bankDetails.create({ data: createData });
            }
        }
        return res.status(200).json({ message: "Employee updated successfully" });
    }
    catch (error) {
        console.error("update-employee error:", error);
        if (error?.code === "P2002") {
            return res
                .status(400)
                .json({ message: "Duplicate value violates unique constraint" });
        }
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
class BadRequestError extends Error {
    constructor(message) {
        super(message);
        this.statusCode = 400;
    }
}
const required = (value, fieldName) => {
    const parsed = String(value ?? "").trim();
    if (!parsed) {
        throw new BadRequestError(`${fieldName} is required`);
    }
    return parsed;
};
router.post(`/add-store`, async (req, res) => {
    try {
        const body = req.body ?? {};
        const name = required(body.ownerName, "Owner name");
        const phone = required(body.ownerPhone, "Owner phone");
        const email = required(body.ownerEmail, "Owner email");
        const storeName = required(body.storeName, "Store name");
        const storeAddress = {
            city: required(body.city, "City"),
            pincode: required(body.pinCode, "Pincode"),
            state: required(body.state, "State"),
            streetAddress: required(body.streetAddress, "Street address"),
        };
        const password = required(body.password, "Password");
        let storeId = `STR${(0, id_gen_1.generateSixDigitNumber)()}`;
        const hashedPass = await (0, bcrypt_1.hash)(password, 10);
        const existing = await prisma_1.prisma.user.findUnique({ where: { phone, email } });
        const existingStore = await prisma_1.prisma.store.findUnique({ where: { storeId } });
        if (existingStore) {
            storeId = `STR${(0, id_gen_1.generateSixDigitNumber)()}`;
        }
        if (existing) {
            return res
                .status(400)
                .json({ message: "User with this phone or email already exists" });
        }
        const created = await prisma_1.prisma.user.create({
            data: {
                phone,
                email,
                password: hashedPass,
                isAdmin: false,
                role: enums_1.Role.STORE_OWNER,
                store: {
                    create: {
                        storeId,
                        ownerName: name,
                        storeName: storeName,
                        ownerPhone: phone,
                        ownerEmail: email,
                        address: {
                            create: {
                                streetAddress: storeAddress.streetAddress,
                                city: storeAddress.city,
                                state: storeAddress.state,
                                pinCode: storeAddress.pincode,
                                country: "India",
                            }
                        }
                    }
                }
            }
        });
        if (!created) {
            return res.status(500).json({ message: "Failed to create store owner" });
        }
        return res.status(201).json({
            success: true,
        });
    }
    catch (error) {
        console.error("add-store error:", error);
        if (error instanceof BadRequestError) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.default = router;

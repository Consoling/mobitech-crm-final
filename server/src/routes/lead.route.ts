import express, { Request, Response } from "express";
import { prisma } from "../config/prisma";

const router = express.Router();

router.get("/lead-data", async (req: Request, res: Response) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 10, 1),
      100
    );

    const sort =
      req.query.sort === "asc"
        ? "asc"
        : "desc";

    const type =
      typeof req.query.type === "string"
        ? req.query.type
        : "phone";

    const prefixMap = {
      phone: "SOMB",
      tablet: "SOTB",
      other: "SOOA",
    } as const;

    if (!(type in prefixMap)) {
      return res.status(400).json({
        result: "error",
        message: "Invalid lead type",
      });
    }

    const prefix =
      prefixMap[type as keyof typeof prefixMap];

    const skip = (page - 1) * limit;

    const where = {
      sessionId: {
        startsWith: prefix,
      },
    };

    const [leads, total] = await Promise.all([
      prisma.leadData.findMany({
        where,

        orderBy: {
          createdAt: sort,
        },

        skip,
        take: limit,

        select: {
          id: true,
          sessionId: true,
          name: true,
          mobileNumber: true,
          address: true,
          userVerified: true,
          device: true,
          form: true,
          createdAt: true,
          updatedAt: true,

          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      }),

      prisma.leadData.count({
        where,
      }),
    ]);

    return res.status(200).json({
      result: "success",
      data: {
        leads,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch leads:", error);

    return res.status(500).json({
      result: "error",
      message: "Failed to fetch leads",
    });
  }
});


router.get("/lead-data/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const lead = await prisma.leadData.findUnique({
      where: {
        id,
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            address: true,
            isVerified: true,
          },
        },
      },
    });

    if (!lead) {
      return res.status(404).json({
        result: "error",
        message: "Lead not found",
      });
    }

    return res.status(200).json({
      result: "success",
      data: lead,
    });
  } catch (error) {
    console.error("Failed to fetch lead:", error);

    return res.status(500).json({
      result: "error",
      message: "Failed to fetch lead",
    });
  }
});

export default router;
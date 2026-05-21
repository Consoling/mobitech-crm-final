
import express from "express";
import { prisma } from "../../../config/prisma";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { userDbId } = req.body;
    if (!userDbId) {
      return res.status(400).json({ error: "userDbId is required" });
    }

    const doorStepPickups = await prisma.doorstepPickup.findMany({
      where: { employeeId: userDbId },
    });

    // For each DoorstepPickup, fetch its respective Declaration and inject
    const dstpickupsWithDeclaration = await Promise.all(
      doorStepPickups.map(async (pickup) => {
        let declaration = null;
        if (pickup.orderId) {
          declaration = await prisma.declaration.findUnique({
            where: { orderId: pickup.orderId },
          });
        }
        return { ...pickup, declaration };
      })
    );
console.log("Fetched doorstep pickups with declarations:", dstpickupsWithDeclaration.length);
    res.status(200).json({
      success: true,
      user: {
        dstpickups: dstpickupsWithDeclaration,
      },
    });
  } catch (error) {
    console.error("Error in fetch-data route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

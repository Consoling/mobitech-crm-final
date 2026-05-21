import express, { Request, Response } from "express";
import { prisma } from "../config/prisma";

const router = express.Router();
router.get("/fetch-parties", async (req: Request, res: Response) => {
	try {
		const parties = await prisma.parties.findMany({
			select: {
				id: true,
				firstName: true,
				lastName: true,
				email: true,
				phone: true,
				bankDetails: true,
				purchases: true,
			},
		});
		return res.status(200).json({ parties });
	} catch (error) {
		console.error("Error fetching parties:", error);
		return res.status(500).json({ message: "Internal Server Error" });
	}
});

router.post("/add-party", async (req: Request, res: Response) => {
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

		const hasAddress = Boolean(
			streetAddress || area || city || state || pinCode,
		);

		const bankDetailsBody = body.bankDetails ?? null;

		const created = await prisma.parties.create({
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
				bankDetails: bankDetailsBody
					? {
							accountNumber: String(bankDetailsBody.accountNumber ?? ""),
							ifscCode: String(bankDetailsBody.ifscCode ?? ""),
							bankName: String(bankDetailsBody.bankName ?? ""),
							isBankVerified: Boolean(bankDetailsBody.isBankVerified ?? false),
							beneficiaryName: String(bankDetailsBody.beneficiaryName ?? ""),
						}
					: undefined,
			},
		});

		return res.status(201).json({
			success: true,
			party: {
				id: created.id,
				firstName: created.firstName,
				lastName: created.lastName,
				email: created.email,
				phone: created.phone,
				bankDetails: created.bankDetails ?? null,
			},
			message: "Party created successfully",
		});
	} catch (error: any) {
		console.error("Error creating party:", error);
		if (error?.code === "P2002") {
			return res
				.status(400)
				.json({ message: "Party with this phone or email already exists" });
		}
		return res.status(500).json({ message: "Internal Server Error" });
	}
});

router.get("/:partyId", async (req: Request, res: Response) => {
	try {
		const { partyId } = req.params as { partyId: string };
		if (!partyId) {
			return res.status(400).json({ message: "partyId is required" });
		}

		const party = await prisma.parties.findUnique({
			where: { id: partyId },
			select: {
				id: true,
				firstName: true,
				lastName: true,
				email: true,
				phone: true,
				address: true,
				bankDetails: true,
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

		if (!party) {
			return res.status(404).json({ message: "Party not found" });
		}

		const address = (party.address as Record<string, unknown> | null) ?? null;

		return res.status(200).json({
			party: {
				id: party.id,
				firstName: party.firstName,
				lastName: party.lastName,
				email: party.email,
				phone: party.phone,
				streetAddress: String(address?.streetAddress ?? ""),
				area: String(address?.area ?? ""),
				city: String(address?.city ?? ""),
				state: String(address?.state ?? ""),
				pinCode: String(address?.pinCode ?? ""),
				bankDetails: party.bankDetails ?? null,
				purchases: party.purchases,
			},
		});
	} catch (error) {
		console.error("Error fetching party by id:", error);
		return res.status(500).json({ message: "Internal Server Error" });
	}
});

router.put("/:partyId", async (req: Request, res: Response) => {
	try {
		const { partyId } = req.params as { partyId: string };
		if (!partyId) {
			return res.status(400).json({ message: "partyId is required" });
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

		const hasAddress = Boolean(
			streetAddress || area || city || state || pinCode,
		);

		const bankDetailsBody = body.bankDetails ?? null;

		const updated = await prisma.parties.update({
			where: { id: partyId },
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
				bankDetails: bankDetailsBody
					? {
							accountNumber: String(bankDetailsBody.accountNumber ?? ""),
							ifscCode: String(bankDetailsBody.ifscCode ?? ""),
							bankName: String(bankDetailsBody.bankName ?? ""),
							isBankVerified: Boolean(bankDetailsBody.isBankVerified ?? false),
							beneficiaryName: String(bankDetailsBody.beneficiaryName ?? ""),
						}
					: undefined,
			},
		});

		return res.status(200).json({
			success: true,
			party: {
				id: updated.id,
				firstName: updated.firstName,
				lastName: updated.lastName,
				email: updated.email,
				phone: updated.phone,
				bankDetails: updated.bankDetails ?? null,
			},
			message: "Party updated successfully",
		});
	} catch (error: any) {
		console.error("Error updating party:", error);
		if (error?.code === "P2025") {
			return res.status(404).json({ message: "Party not found" });
		}
		if (error?.code === "P2002") {
			return res
				.status(400)
				.json({ message: "Party with this phone or email already exists" });
		}
		return res.status(500).json({ message: "Internal Server Error" });
	}
});

export default router;
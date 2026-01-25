import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema(
	{
		brand: { type: String },
		model: { type: String },
		category: { type: String },
		price: { type: String },
		specifications: [{ type: String }],
		imageUrl: { type: String },
		productUrl: { type: String },
		scrapedAt: { type: Date },
		smc: { type: String, index: true },
		detailedSpecifications: {
			title: { type: String },
			price: { type: String },
			display: { type: String },
			variants: [
				{
					name: { type: String },
					price: { type: String }
				}
			],
			os: { type: String },
			processor: { type: String },
			chipset: { type: String },
			battery: { type: String },
			frontCamera: { type: String },
			backCamera: { type: String },
			connectivity: [
				{
					type: { type: String },
					value: { type: String }
				}
			]
		},
		modelCodes: [{ type: String }]
	},
	{
		timestamps: true,
		strict: true
	}
);


const Device = mongoose.models.Device || mongoose.model('Device', deviceSchema);

export default Device;
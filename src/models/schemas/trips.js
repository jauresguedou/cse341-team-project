import mongoose from "mongoose";

const tripSchema = new mongoose.Schema(
	{
		id: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			required: true,
			trim: true,
		},
		region: {
			type: String,
			required: true,
			trim: true,
		},
		startStation: {
			type: String,
			required: true,
			trim: true,
		},
		endStation: {
			type: String,
			required: true,
			trim: true,
		},
		duration: {
			type: String,
			required: true,
			trim: true,
		},
		distance: {
			type: Number,
			required: true,
			min: 0,
		},
		highlights: {
			type: [String],
			required: true,
			validate: {
				validator: (highlights) => highlights.length > 0,
				message: "At least one highlight is required",
			},
		},
		bestSeason: {
			type: String,
			required: true,
			enum: ["spring", "summer", "autumn", "winter"],
			trim: true,
		},
		operatingMonths: {
			type: [Number],
			required: true,
			validate: {
				validator: (months) =>
					months.length > 0 && months.every((month) => month >= 1 && month <= 12),
				message: "Operating months must contain values from 1 through 12",
			},
		},
		imageUrl: {
			type: String,
			required: true,
			trim: true,
		},
	},
	{
		timestamps: true,
	}
);

const Trip = mongoose.model("Trip", tripSchema);

export default Trip;
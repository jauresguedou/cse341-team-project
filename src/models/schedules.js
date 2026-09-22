import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
	{
		id: Number,
		tripId: String,
		date: String,
		departureTime: String,
		arrivalTime: String,
		trainId: String,
		availableSeats: Number,
	},
	{
		collection: "schedules",
		strict: false,
	}
);

const Schedule = mongoose.models.Schedule || mongoose.model("Schedule", scheduleSchema);

export default Schedule;
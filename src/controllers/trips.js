import {
	getTripById as findTripById,
	getPaginatedTrips as findPaginatedTrips,
	tripIdExists,
	insertTrip,
	findTripDocument,
} from "../models/trips.js";
import Schedule from "../models/schedules.js";

export function tripListPage(req, res) {
	res.render("trips/list", {
		title: "Scenic Train Trips",
	});
}

export async function tripDetailsPage(req, res) {
	const { tripId } = req.params;
	const details = await findTripById(tripId);

	if (!details) {
		res.status(404).render("404", {
			title: "Trip Not Found",
		});
		return
	}
	details.schedules = await Schedule.find({ tripId }).lean();

	res.render("trips/details", {
		title: "Trip Details",
		details,
	});
}

export async function getTripById(req, res) {
	try {
		const { id } = req.params;

		const trip = await findTripById(id);

		if (!trip) {
			return res.status(404).json({
				error: "Trip not found",
			});
		}

		return res.status(200).json(trip);
	} catch (error) {
		console.error("Error fetching trip:", error);

		return res.status(500).json({
			error: "Failed to fetch trip",
		});
	}
}

export async function getAllTrips(req, res) {
	try {
		const page = Number(req.query.page ?? 1);
		const limit = Number(req.query.limit ?? 10);

		if (
			!Number.isInteger(page) ||
			page < 1 ||
			!Number.isInteger(limit) ||
			limit < 1
		) {
			return res.status(400).json({
				error: "Page and limit must be positive integers",
			});
		}

		const filterNames = ["region", "season", "search"];
		if (
			filterNames.some(
				(name) => req.query[name] !== undefined && typeof req.query[name] !== "string",
			)
		) {
			return res.status(400).json({
				error: "Region, season, and search must be strings",
			});
		}

		const filters = Object.fromEntries(
			filterNames.map((name) => [name, req.query[name]?.trim() || undefined]),
		);
		const result = await findPaginatedTrips(page, limit, filters);

		return res.status(200).json({
			trips: result.trips,
			pagination: {
				page,
				limit,
				totalItems: result.totalItems,
				totalPages: Math.ceil(result.totalItems / limit),
			},
			filterOptions: {
				regions: result.regions,
				seasons: result.seasons,
			},
		});
	} catch (error) {
		console.error("Error fetching trips:", error);

		return res.status(500).json({
			error: "Failed to fetch trips",
		});
	}
}
const TRIP_FIELDS = [
	"id",
	"name",
	"description",
	"region",
	"startStation",
	"endStation",
	"duration",
	"distance",
	"highlights",
	"bestSeason",
	"operatingMonths",
	"imageUrl",
];

// Keep only known trip fields so callers cannot set _id, createdAt, etc.
const pickTripFields = (body = {}) =>
	Object.fromEntries(
		TRIP_FIELDS.filter((field) => body[field] !== undefined).map((field) => [
			field,
			body[field],
		]),
	);

export async function createTrip(req, res) {
	try {
		const data = pickTripFields(req.body);

		// Only look up string ids; the schema reports anything else as invalid.
		if (typeof data.id === "string" && (await tripIdExists(data.id.trim()))) {
			return res.status(409).json({
				error: "A trip with this id already exists",
			});
		}

		const trip = await insertTrip(data);

		return res.status(201).json(trip);
	} catch (error) {
		if (error.name === "ValidationError") {
			return res.status(400).json({
				error: "Invalid trip data",
				details: Object.values(error.errors).map((issue) => issue.message),
			});
		}

		if (error.code === 11000) {
			return res.status(409).json({
				error: "A trip with this id already exists",
			});
		}

		console.error("Error creating trip:", error);

		return res.status(500).json({
			error: "Failed to create trip",
		});
	}
}

export async function updateTrip(req, res) {
	try {
		const { id } = req.params;
		const updates = pickTripFields(req.body);

		// A trip's id is its public name and cannot be changed.
		if (updates.id !== undefined && updates.id !== id) {
			return res.status(400).json({
				error: "Trip id cannot be changed",
			});
		}
		delete updates.id;

		if (Object.keys(updates).length === 0) {
			return res.status(400).json({
				error: "No valid trip fields to update",
			});
		}

		const trip = await findTripDocument(id);

		if (!trip) {
			return res.status(404).json({
				error: "Trip not found",
			});
		}

		// set() applies the changes; save() runs the full schema validation
		// and writes nothing if any rule fails.
		trip.set(updates);
		await trip.save();

		return res.status(200).json(trip.toObject());
	} catch (error) {
		if (error.name === "ValidationError" || error.name === "CastError") {
			return res.status(400).json({
				error: "Invalid trip data",
				details: error.errors
					? Object.values(error.errors).map((issue) => issue.message)
					: [error.message],
			});
		}

		console.error("Error updating trip:", error);

		return res.status(500).json({
			error: "Failed to update trip",
		});
	}
}
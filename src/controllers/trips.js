import {
	getTripById as findTripById,
	getPaginatedTrips as findPaginatedTrips,
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
 
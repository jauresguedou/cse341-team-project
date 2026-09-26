import {
	getTripById as findTripById,
	getAllTrips as findAllTrips,
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
		const trips = await findAllTrips();

		return res.status(200).json(trips);
	} catch (error) {
		console.error("Error fetching trips:", error);

		return res.status(500).json({
			error: "Failed to fetch trips",
		});
	}
}

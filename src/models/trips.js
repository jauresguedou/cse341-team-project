import Trip from "./schemas/trips.js";

export async function getTripById(id) {
	return Trip.findOne({ id }).lean();
}

export async function getPaginatedTrips(page, limit) {
	const [trips, totalItems, regions, seasons] = await Promise.all([
		Trip.find({})
			.sort({ id: 1 })
			.skip((page - 1) * limit)
			.limit(limit)
			.lean(),
		Trip.countDocuments({}),
		Trip.distinct("region"),
		Trip.distinct("bestSeason"),
	]);

	return {
		trips,
		totalItems,
		regions: regions.sort(),
		seasons: seasons.sort(),
	};
} 
import Trip from "./schemas/trips.js";

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function getTripById(id) {
	return Trip.findOne({ id }).lean();
}

export async function getPaginatedTrips(page, limit, filters = {}) {
	const query = {};
	const { region, season, search } = filters;

	if (region) {
		query.region = new RegExp(`^${escapeRegExp(region)}$`, "i");
	}
	if (season) {
		query.bestSeason = new RegExp(`^${escapeRegExp(season)}$`, "i");
	}
	if (search) {
		const searchPattern = new RegExp(escapeRegExp(search), "i");
		query.$or = [{ name: searchPattern }, { description: searchPattern }];
	}

	const [trips, totalItems, regions, seasons] = await Promise.all([
		Trip.find(query)
			.sort({ id: 1 })
			.skip((page - 1) * limit)
			.limit(limit)
			.lean(),
		Trip.countDocuments(query),
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

export async function tripIdExists(id) {
	return Boolean(await Trip.exists({ id }));
}

export async function insertTrip(data) {
	const trip = await Trip.create(data);
	return trip.toObject();
}

export async function findTripDocument(id) {
	return Trip.findOne({ id });
}
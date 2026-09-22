import { getDb } from "../db/connect.js";

export async function getTripById(id) {
	const db = getDb();
	return db.collection("trips").findOne({ id });
}

export async function getAllTrips() {
	const db = getDb();

	return db.collection("trips").find({}).toArray();
} 
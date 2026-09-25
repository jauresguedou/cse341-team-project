import mongoose from "mongoose";
import Trip from "../models/schemas/trips.js";
import trips from './seeds/trips.json' with { type: "json" }

export async function mongooseConnect() {
    try {
        await mongoose.connect(process.env['MONGODB_URI']);
        console.log("Database connected successfully!")
    } catch (err) {
        console.error({ ...err, error_name: err.name })
    }
}
import mongoose from "mongoose";


export default async function mongoose_connect() {
    try {
        await mongoose.connect(process.env['MONGODB_URI'])
        console.log("Mongoose successfully connected")
    } catch (err) {
        console.error({
            error_name: err.name,
            error_message: err.message
        })
    }
}
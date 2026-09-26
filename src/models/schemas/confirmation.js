import mongoose, { model, Schema } from "mongoose";

const passengerSchema = new Schema({
    firstName: String,
    lastName: String,
    email: String,
    phone: String
}, { _id: false });


const confirmationSchema = new Schema({
    id: String,
    createdAt: String,
    scheduleId: String,
    tripId: String,
    ticketClass: String,
    selectedDay: String,
    passengers: [passengerSchema]
})

const Confirmation = mongoose.model.Confirmation || model('Confirmation', confirmationSchema)

export default Confirmation;
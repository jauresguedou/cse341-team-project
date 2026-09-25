import mongoose from 'mongoose';


const roleSchema = new mongoose.Schema(
    {
        name: {
           type: String,
           required: true,
           trim: true,
           lowercase: true,
           unique: true,
           enum: ['user', 'admin']
        },

        description: {
            type: String,
            required: true,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);
export default roleSchema;
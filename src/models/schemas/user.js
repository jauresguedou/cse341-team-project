import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        displayName: {
            type: String,
            required: true, 
            trim: true,
        },

        username: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            unique: true,
        },

        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            unique: true,
            match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        },

        passwordHash: {
            type: String,
            required: true,
            select: false,
        },
        
        role: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);
const User = mongoose.model('User', userSchema);
export default User;
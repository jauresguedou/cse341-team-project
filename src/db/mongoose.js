import mongoose from 'mongoose';

const connectToMongoose = async () => {
    const connectionString = process.env.MONGODB_URI;
    const databaseName = process.env.MONGODB_DB_NAME || 'practice';

    if (!connectionString) {
        throw new Error('MONGODB_URI is required.');
    }

    await mongoose.connect(connectionString, {
        dbName: databaseName
    });

    console.log('Mongoose connected to MongoDB.');
};

export { connectToMongoose };
import mongoose from 'mongoose'

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING);
        console.log("Connect to database successfully.")
    } catch (error) {
        console.log("Error to connect to database", error);
        process.exit(1)
    }
}
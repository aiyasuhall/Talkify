import express from 'express'
import dotenv from 'dotenv'
import { connectDB } from './libs/db.js'
import authRoute from './routes/authRoute.js'
import cookieParser from "cookie-parser"
import userRoute from './routes/userRoute.js'
import friendRoute from './routes/friendRoute.js'
import conversationRoute from './routes/conversationRoute.js'
import { protectedRoute } from './middlewares/authMiddleware.js'
import messageRoute from './routes/messageRoute.js'
import cors from "cors"
import { app, server } from "./socket/index.js"
import { v2 as cloudinary } from 'cloudinary'

dotenv.config();

const PORT = process.env.PORT || 5001;

// middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

// public routes
app.use("/api/auth", authRoute);

// private routes
app.use(protectedRoute) // express chạy từ trên xuống dưới, chạy middleware rồi mới xuống các api dưới
app.use("/api/users", userRoute);
app.use("/api/friends", friendRoute);
app.use("/api/messages", messageRoute);
app.use("/api/conversations", conversationRoute)

connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`Server is listening on PORT ${PORT}`)
    });
})

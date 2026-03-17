import jwt from "jsonwebtoken"
import User from "../models/User.js"

export const socketAuthMiddleware = async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error("Unauthorized - token is not exist."));
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (!decoded) {
            return next(new Error("Unauthorized - token is invalid or expired."));
        }

        const user = await User.findById(decoded.userId).select("-hashedPassword");
        if (!user) {
            return next(new Error("User is not exist."));
        }

        socket.user = user;

        next();
    } catch (error) {
        console.error("Error to verify JWT in socketMiddleware", error);
        return next(new Error("Unauthorized"));
    }
}
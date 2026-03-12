import jwt from "jsonwebtoken"
import User from "../models/User.js"

// authorization - xác mình user là ai
export const protectedRoute = (req, res, next) => {
    try {
        // lấy access token từ header
        const authHeader = req.headers['authorization']; // lấy ra authorization trong request header client gửi lên
        const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

        if (!token) {
            return res.status(401).json({message: "Cannot find access token."})
        }

        // xác nhận token hợp lệ
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decodedUser) => {
            if (err) {
                console.error(err);
                return res.status(403).json({message: "Access token expired or incorrect."})
            }

            // tìm user
            const user = await User.findById(decodedUser.userId).select('-hashedPassword');

            if (!user) {
                return res.status(404).json({ message: "User not found." })
            }

            // trả user về trong req
            req.user = user;
            next();
        })
    } catch (error) {
        console.error("Error to authorize JWT in authMiddleware", error);
        return res.status(500).json({message: "System error."})
    }
}
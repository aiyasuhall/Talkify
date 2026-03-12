import bcrypt from "bcrypt"
import User from "../models/User.js"
import jwt from "jsonwebtoken"
import Session from "../models/Session.js"
import crypto from "crypto"

const ACCESS_TOKEN_TTL = "15m"; // thường là dưới 15m
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; // 14 ngày
 
export const signUp = async (req, res) => {
    try {
        const { username, password, email, firstName, lastName } = req.body;

        if (!username || !password || !email || !firstName || !lastName) {
            return res.status(400).json({ message: "username, password, firstName, lastName cannot be empty." })
        }

        // kiểm tra user tồn tại chưa ?
        const duplicate = await User.findOne({ username });

        if (duplicate) {
            return res.status(409).json({ message: "Username already exists." })
        }

        // mã hóa pass
        const hashedPassword = await bcrypt.hash(password, 10); // salt = 10

        // tạo user mới
        await User.create({
            username,
            hashedPassword,
            email,
            displayName: `${lastName}, ${firstName}`
        });

        // return
        return res.sendStatus(204);

    } catch (error) {
        console.error("Error to call signUp", error);
        return res.status(500).json({ message: "System error!" })
    }
};

export const signIn = async (req, res) => {
    try {
        // lấy input
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "username or password is missing." })
        }
        // lấy hashedpass trong db để so với pass input
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({ message: "username or password is incorrect." })
        }

        // kiểm tra pass
        const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);

        if (!passwordCorrect) {
            return res.status(401).json({ message: "username or password is incorrect." })
        }

        // nếu khớp, tạo accessToken với JWT
        const accessToken = jwt.sign({ userId: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
        
        // tạo refresh token
        const refreshToken = crypto.randomBytes(64).toString("hex");
        
        // tạo session mới để lưu refresh token
        await Session.create({
            userId: user._id,
            refreshToken,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL)
        });

        // trả refresh token về trong cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none", //backend, frontend deploy riêng
            maxAge: REFRESH_TOKEN_TTL
        })

        //trả access token về trong res
        return res.status(200).json({ message: `User ${user.displayName} is logged in.`, accessToken })


    } catch (error) {
        console.error("Error to call signIn", error);
        return res.status(500).json({ message: "System error!" })
    }
};

export const signOut = async (req, res) => {
    try {
        // lấy refresh token từ cookie
        const token = req.cookies?.refreshToken;

        if (token) {
            // xóa refresh token trong Session
            await Session.deleteOne({ refreshToken: token });
            // xóa cookie 
            res.clearCookie("refreshToken");
        }
        
        return res.sendStatus(204);

    } catch (error) { 
        console.error("Error to call signOut", error);
        return res.status(500).json({ message: "System error!" })
    }
};

// tạo access token từ refresh token
export const refreshToken = async (req, res) => {
    try {
        // lấy refresh token từ cookie
        const token = req.cookies?.refreshToken; // cookies có s nhé boi
        if (!token) {
            return res.status(401).json({ message: "Token is not exist." });
        }

        // so với refresh token trong db
        const session = await Session.findOne({ refreshToken: token });

        if (!session) {
            return res.status(403).json({ message: "Token is invalid or expired" });
        }

         // kiểm tra hết hạn
        if (session.expiresAt < new Date()) {
            return res.status(403).json({message: "Token is expired."})
        }

        // tạo access token mới
        const accessToken = jwt.sign({
            userId: session.userId
        }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
   
        // return
        return res.status(200).json({ accessToken });
    } catch (error) {
        console.error("Error to call refreshToken", error);
        return res.status(500).json({ message: "System error." });
    }
}
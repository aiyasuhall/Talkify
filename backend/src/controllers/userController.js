import { uploadImageFromBuffer } from "../middlewares/uploadMiddleware.js";
import User from "../models/User.js";

export const authMe = async (req, res) => {
    try {
        const user = req.user // lấy từ middleware
        return res.status(200).json(user)
    } catch (error) {
        console.error("Error to call authMe", error);
        return res.status(500).json({ message: "System error." })
    }
};

export const searchUserByUsername = async (req, res) => {
    try {
        const { username } = req.query;

        if (!username || username.trim() === "") {
            return res.status(400).json({ message: "Need to provide username in query." });
        }

        const user = await User.findOne({ username }).select(
            "_id displayName username avatarUrl"
        );

        return res.status(200).json({ user })
    } catch (error) {
        console.error("Error to searchUserByUsername", error);
        return res.status(500), json({ message: "System error." })
    }
};

export const uploadAvatar = async (req, res) => {
    try {
        const file = req.file;
        const userId = req.user._id;

        if (!file) {
            return res.status(400).json({ message: "No file uploaded." })
        }

        const result = await uploadImageFromBuffer(file.buffer); // file.buffer là data multer đã lưu trong bộ nhớ

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                avatarUrl: result.secure_url,
                avatarId: result.public_id,
            },

            {
                new: true, // trả về user đã cập nhật
            }
        ).select("avatarUrl"); // trả lại đúng data frontend cần

        if (!updatedUser.avatarUrl) {
            return res.status(400).json({message: "Avatar returns null."})
        }

        return res.status(200).json({ avatarUrl: updatedUser.avatarUrl });
    } catch (error) {
        console.error("Error to upload avatar.", error);
        return res.status(500).json({message: "Upload failed."})
    }
}
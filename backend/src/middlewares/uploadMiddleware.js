import multer from "multer"
import { v2 as cloudinary } from 'cloudinary';

export const upload = multer({
    storage: multer.memoryStorage(), // lưu vào ram
    limits: {
        fieldSize: 1024 * 1024 * 1, // 1mb
        fileSize: 1024 * 1024 * 5,
    }
});

export const uploadImageFromBuffer = (buffer, options) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({
            folder: "talkify_chat/avatars", // folder này chưa tồn tại, cloudinary sẽ tự tạo
            resource_type: "image",
            transformation: [{ width: 200, height: 200, crop: "fill" }],
            ...options,
        },
            (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(result)
                }
            }
        );

        uploadStream.end(buffer);
    })
};

export const uploadChatImage = (buffer) => {
    return uploadImageFromBuffer(buffer, {
        folder: "talkify_chat/messages",
        transformation: [{ width: 1200, crop: "limit" }],
    });
}
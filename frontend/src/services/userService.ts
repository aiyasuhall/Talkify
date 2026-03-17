import api from "@/lib/axios"

export const userService = {
    uploadAvatar: async (formData: FormData) => {
        const res = await api.post("/users/uploadAvatar", formData, {
            headers: { "Content-Type": "multipart/form-data" } // để backend biết đang upload file, multer có thể đọc file này
        });

        if (res.status === 400) {
            throw new Error(res.data.message);
        }

        return res.data;
    }
}
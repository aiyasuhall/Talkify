// quản lí state và logic liên quan tới user

import { userService } from "@/services/userService";
import type { UserState } from "@/types/store";
import {create} from "zustand"
import { useAuthStore } from "./useAuthStore";
import { toast } from "sonner";
import { useChatStore } from "./useChatStore";

export const useUserStore = create<UserState>((set, get) => ({
    updateAvatarUrl: async (formData) => {
        try {
            const { user, setUser } = useAuthStore.getState();
            const data = await userService.uploadAvatar(formData);

            if (user) {
                setUser({
                    ...user,
                    avatarUrl: data.avatarUrl
                });

                useChatStore.getState().fetchConversations(); // để cập nhật lại avatar của các thành viên trong conversation
            }
        } catch (error) {
            console.error("Error to updateAvatarUrl.", error);
            toast.error("Avatar upload unsuccessfully!")
        }
    }
}))
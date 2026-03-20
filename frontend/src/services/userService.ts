import api from "@/lib/axios";

export const userService = {
  uploadAvatar: async (formData: FormData) => {
    const res = await api.post("/users/uploadAvatar", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return res.data;
  },

  updateProfile: async (payload: {
    displayName: string;
    email: string;
    phone?: string;
    bio?: string;
  }) => {
    const res = await api.patch("/users/profile", payload);
    return res.data.user;
  },

  updatePreferences: async (payload: { showOnlineStatus: boolean }) => {
    const res = await api.patch("/users/preferences", payload);
    return res.data.user;
  },

  changePassword: async (payload: { currentPassword: string; newPassword: string }) => {
    const res = await api.patch("/users/password", payload);
    return res.data;
  },

  getBlockedUsers: async (page = 1, limit = 10) => {
    const res = await api.get("/users/blocked", {
        params: { page, limit },
    });

    return {
        blockedUsers: res.data.blockedUsers ?? [],
        total: res.data.total ?? 0,
        page: res.data.page ?? page,
        limit: res.data.limit ?? limit,
        hasMore: res.data.hasMore ?? false,
    };
    },

  blockUser: async (targetUserId: string) => {
    const res = await api.post(`/users/block/${targetUserId}`);
    return res.data;
  },

  unblockUser: async (targetUserId: string) => {
    const res = await api.delete(`/users/block/${targetUserId}`);
    return res.data;
  },

  deleteAccount: async (password: string) => {
    const res = await api.delete("/users/account", { data: { password } });
    return res.data;
  }
};
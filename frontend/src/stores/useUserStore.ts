// quản lí state và logic liên quan tới user

import { userService } from "@/services/userService";
import type { UserState } from "@/types/store";
import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { toast } from "sonner";
import { useChatStore } from "./useChatStore";
import { friendService } from "@/services/friendService";

export const useUserStore = create<UserState>(() => ({
  updateAvatarUrl: async (formData) => {
    try {
      const { user, setUser } = useAuthStore.getState();
      const data = await userService.uploadAvatar(formData);

      if (user) {
        setUser({ ...user, avatarUrl: data.avatarUrl });
        await useChatStore.getState().fetchConversations();
      }
    } catch (error) {
      console.error("Error to updateAvatarUrl.", error);
      toast.error("Avatar upload failed.");
    }
  },

  updateProfile: async (payload) => {
    try {
      const updatedUser = await userService.updateProfile(payload);
      useAuthStore.getState().setUser(updatedUser);
      toast.success("Profile updated successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile.");
      throw error;
    }
  },

  updatePreferences: async (payload) => {
    try {
      const updatedUser = await userService.updatePreferences(payload);
      useAuthStore.getState().setUser(updatedUser);
      toast.success("Preferences updated.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update preferences.");
    }
  },

  changePassword: async ({ currentPassword, newPassword }) => {
    try {
      await userService.changePassword({ currentPassword, newPassword });
      toast.success("Password changed successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to change password.");
      throw error;
    }
  },

  blockUserByUsername: async (username) => {
    try {
        const target = await friendService.searchByUserName(username);
        if (!target?._id) {
        toast.error("User not found.");
        return;
        }
        await userService.blockUser(target._id);
        await useChatStore.getState().fetchConversations(); // thêm dòng này
        toast.success("User blocked successfully.");
    } catch (error) {
        console.error(error);
        toast.error("Failed to block user.");
    }
},

  getBlockedUsers: async (page = 1, limit = 10) => {
    try {
        return await userService.getBlockedUsers(page, limit);
    } catch (error) {
        console.error(error);
        toast.error("Failed to load blocked users.");
        return {
        blockedUsers: [],
        total: 0,
        page,
        limit,
        hasMore: false,
        };
    }
},

    unblockUser: async (targetUserId) => {
    try {
        await userService.unblockUser(targetUserId);
        await useChatStore.getState().fetchConversations(); // thêm dòng này
        toast.success("User unblocked.");
    } catch (error) {
        console.error(error);
        toast.error("Failed to unblock user.");
    }
},

  deleteAccount: async (password) => {
    try {
      await userService.deleteAccount(password);
      await useAuthStore.getState().signOut();
      toast.success("Account deleted successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete account.");
      throw error;
    }
  }
}));
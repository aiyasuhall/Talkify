// quản lí state và logic liên quan tới đăng nhập, đăng xuất,...
import { create } from "zustand";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import type { AuthState } from "@/types/store";
import { persist } from "zustand/middleware";
import { useChatStore } from "./useChatStore";

export const useAuthStore = create<AuthState>()(
  persist ((set, get) => ({
  accessToken: null,
  user: null,
  loading: false,

  setAccessToken: (accessToken) => {
    set({ accessToken });
    },
  
    setUser: (user) => {
      set({ user });
  }, // nhận vào user, gọi state để cập nhật lại userState
  
  clearState: () => {
    set({ accessToken: null, user: null, loading: false });
    useChatStore.getState().reset(); // đảm bảo user logout hay lognin chắc chắn có state từ chatStore
    localStorage.clear();
    sessionStorage.clear()
  },

  signUp: async (username, password, email, firstName, lastName) => {
    try {
      set({ loading: true });

      //  gọi api
      await authService.signUp(username, password, email, firstName, lastName);

      toast.success("Register successful! You will be redirected to the login page.");
    } catch (error) {
      console.error(error);
      toast.error("Register unsucessfully");
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (username, password) => {
    try {
      get().clearState();
      set({ loading: true });
      
      const { accessToken } = await authService.signIn(username, password);
      get().setAccessToken(accessToken);

      await get().fetchMe();
      useChatStore.getState().fetchConversations(); // đăng nhập là sidebar có data ngay

      toast.success("Welcome back to Talkify 🎉");
    } catch (error) {
      console.error(error);
      toast.error("Login failed!");
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      get().clearState();
      await authService.signOut();
      toast.success("Logout sucessfully!");
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while logging out. Please try again!");
    }
  },

  fetchMe: async () => {
    try {
      set({ loading: true });
      const user = await authService.fetchMe();

      set({ user });
      
    } catch (error) {
      console.error(error);
      set({ user: null, accessToken: null });
      toast.error("An error occurred while retrieving user data. Please try again!");
    } finally {
      set({ loading: false });
    }
  },

  refresh: async () => {
    try {
      set({ loading: true });
      const { user, fetchMe, setAccessToken } = get();
      const accessToken = await authService.refresh();

      setAccessToken(accessToken);

      if (!user) {
        await fetchMe();
      }
    } catch (error) {
      console.error(error);
      toast.error("Your login session has expired. Please log in again!");
      get().clearState();
    } finally {
      set({ loading: false });
    }
  },
  }), {
    name: "auth-storage",
    partialize: (state) => ({user: state.user}) // chỉ persist là user
})
);
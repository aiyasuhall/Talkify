import { friendService } from "@/services/friendService";
import type { FriendState } from "@/types/store";
import { create } from "zustand"

export const useFriendStore = create<FriendState>((set) => ({
    friends: [],
    loading: false,
    receivedList: [],
    sentList: [],
    searchByUsername: async (username) => {
        try {
            set({ loading: true });

            const user = await friendService.searchByUserName(username);

            return user;
        } catch (error) {
            console.error("Error to find user by username", error);
            return null;
        } finally {
            set({loading: false})
        }
    },

    addFriend: async (to, message) => {
        try {
            set({ loading: true });

            const resultMessage = await friendService.sendFriendRequest(to, message);

            return resultMessage;
        } catch (error) {
            console.error("Error to addFriend.", error);
            return "Error to add friend, please try again!"
        } finally {
            set({loading: false})
        }
    },

    getAllFriendRequests: async () => {
        try {
            set({ loading: true });

            const result = await friendService.getAllFriendRequst();

            if (!result) return;

            const { received, sent } = result;
            set({ receivedList: received, sentList: sent });
        } catch (error) {
            console.error("Error to getAllFriendRequests", error)
        } finally {
            set({loading: false})
        }
    },

    acceptRequest: async (requestId) => {
        try {
            set({ loading: true });

            await friendService.acceptRequest(requestId);

            set((state) => ({
                receivedList: state.receivedList.filter((r) => r._id !== requestId)
            }))
        } catch (error) {
            console.error("Error to acceptRequest.", error)
        }
    },

    declineRequest: async (requestId) => {
        try {
            set({ loading: true });
            await friendService.declineRequest(requestId);

            set((state) => ({
                receivedList: state.receivedList.filter((r) => r._id !== requestId),
            }))
        } catch (error) {
            console.error("Error to declineRequest.", error)
        } finally {
            set({loading: false})
        }
    },

    getFriends: async () => {
        try {
            set({ loading: true });
            const friends = await friendService.getFriendList();

            set({friends: friends})
        } catch (error) {
            console.error("Error to load friends.", error);
            set({friends: []})
        } finally {
            set({loading: false})
        }
    }
}))
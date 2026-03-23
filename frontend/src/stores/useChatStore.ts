import { chatService } from "@/services/chatService";
import type { ChatState } from "@/types/store";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./useAuthStore";
import { useSocketStore } from "./useSocketStore";

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      messages: {},
      activeConversationId: null,
      convoLoading: false,
      messageLoading: false,
      loading: false,

      setActiveConversation: (id) => set({ activeConversationId: id }),
      reset: () => {
        set({
          conversations: [],
          messages: {},
          activeConversationId: null,
          convoLoading: false,
          messageLoading: false,
        });
      },

      fetchConversations: async () => {
        try {
          set({ convoLoading: true });
          const { conversations } = await chatService.fetchConversations();

          set({ conversations, convoLoading: false });
        } catch (error) {
          console.error("Error to fetchConversations: ", error);
          set({ convoLoading: false });
        }
      },

      fetchMessages: async (conversationId) => {
        const { activeConversationId, messages } = get();
        const { user } = useAuthStore.getState();

        const convoId = conversationId ?? activeConversationId;
        if (!convoId) return;

        const current = messages?.[convoId];
        const nextCursor = current?.nextCursor === undefined ? "" : current?.nextCursor;

        if (nextCursor === null) return;

        set({ messageLoading: true });

        try {
          const { messages: fetched, cursor } = await chatService.fetchMessages(convoId, nextCursor);

          const processed = fetched.map((m) => ({
            ...m,
            isOwn: m.senderId === user?._id,
          }));

          set((state) => {
            const prev = state.messages[convoId]?.items ?? [];
            const merged = prev.length > 0 ? [...processed, ...prev] : processed;

            return {
              messages: {
                ...state.messages,
                [convoId]: {
                  items: merged,
                  hasMore: !!cursor,
                  nextCursor: cursor ?? null,
                },
              },
            };
          });
        } catch (error) {
          console.error("Error to fetchMessages: ", error);
        } finally {
          set({ messageLoading: false });
        }
      },

      sendDirectMessage: async (recipientId, content, imageFile) => {
        try {
          const { activeConversationId } = get();
          await chatService.sendDirectMessage(
            recipientId,
            content,
            imageFile,
            activeConversationId || undefined
          );

          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === activeConversationId ? { ...c, seenBy: [] } : c
            ),
          }));
        } catch (error) {
          console.error("Error to sendDirectMessage.", error);
        }
      },

      sendGroupMessage: async (conversationId, content, imageFile) => {
        try {
          await chatService.sendGroupMessage(conversationId, content, imageFile);
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === get().activeConversationId ? { ...c, seenBy: [] } : c
            ),
          }));
        } catch (error) {
          console.error("Error to sendGroupMessage", error);
        }
      },

      addMessage: async (message) => {
        try {
          const { user } = useAuthStore.getState();
          const { fetchMessages } = get();

          message.isOwn = message.senderId === user?._id;

          const convoId = message.conversationId;

          let prevItems = get().messages[convoId]?.items ?? [];
          if (prevItems.length === 0) {
            await fetchMessages(message.conversationId);
            prevItems = get().messages[convoId]?.items ?? [];
          }

          set((state) => {
            if (prevItems.some((m) => m._id === message._id)) {
              return state;
            }

            const currentMeta = state.messages[convoId] ?? {
              hasMore: false,
              nextCursor: undefined,
            };

            return {
              messages: {
                ...state.messages,
                [convoId]: {
                  items: [...prevItems, message],
                  hasMore: currentMeta.hasMore,
                  nextCursor: currentMeta.nextCursor ?? undefined,
                },
              },
            };
          });
        } catch (error) {
          console.error("Error to add message: ", error);
        }
      },

      updateConversation: async (conversation) => {
        set((state) => {
          if (!conversation || typeof conversation !== "object") return state;

          const conv = conversation as { _id: string } & Record<string, unknown>;
          const existing = state.conversations.find((c) => c._id === conv._id);

          if (!existing) return state;

          const merged = { ...existing, ...conv };
          const others = state.conversations.filter((c) => c._id !== conv._id);

          return {
            conversations: [merged, ...others],
          };
        });
      },

      markAsSeen: async () => {
        try {
          const { user } = useAuthStore.getState();
          const { activeConversationId, conversations } = get();

          if (!activeConversationId || !user) return;

          const convo = conversations.find((c) => c._id === activeConversationId);
          if (!convo) return;

          if ((convo.unreadCounts?.[user._id] ?? 0) === 0) {
            return;
          }

          await chatService.markAsSeen(activeConversationId);

          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === activeConversationId && c.lastMessage
                ? {
                    ...c,
                    unreadCounts: {
                      ...c.unreadCounts,
                      [user._id]: 0,
                    },
                  }
                : c
            ),
          }));
        } catch (error) {
          console.error("Error to mark as seen in store.", error);
        }
      },

      addConvo: (convo) => {
        set((state) => {
          const exists = state.conversations.some(
            (c) => c._id.toString() === convo._id.toString()
          );

          return {
            conversations: exists ? state.conversations : [convo, ...state.conversations],
            activeConversationId: convo._id,
          };
        });
      },

      createConversation: async (type, name, memberIds) => {
        try {
          set({ loading: true });
          const conversation = await chatService.createConversation(type, name, memberIds);

          get().addConvo(conversation);

          const { messages } = get();
          if (!messages[conversation._id]) {
            await get().fetchMessages(conversation._id);
          }

          useSocketStore.getState().socket?.emit("join-conversation", conversation._id);
        } catch (error) {
          console.error("Error to call createConversation in store", error);
        } finally {
          set({ loading: false });
        }
      },

      renameConversation: async (conversationId: string, newName: string, targetUserId?: string) => {
        try {
          await chatService.renameConversation(conversationId, newName, targetUserId);
          set((state) => ({
            conversations: state.conversations.map((c) => {
              if (c._id === conversationId) {
                if (c.type === "group" && c.group) {
                  return { ...c, group: { ...c.group, name: newName } };
                } else if (c.type === "direct" && targetUserId) {
                  return {
                    ...c,
                    nicknames: { ...(c.nicknames || {}), [targetUserId]: newName },
                  };
                }
              }
              return c;
            }),
          }));
        } catch (error) {
          console.error("Error to rename conversation in store", error);
        }
      },

      deleteConversation: async (conversationId: string) => {
        try {
          await chatService.deleteConversation(conversationId);
          set((state) => ({
            conversations: state.conversations.filter((c) => c._id !== conversationId),
            activeConversationId:
              state.activeConversationId === conversationId ? null : state.activeConversationId,
          }));
        } catch (error) {
          console.error("Error to delete conversation in store", error);
        }
      },

      updateConversationNameLocally: (conversationId: string, newName: string, targetUserId?: string) => {
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c._id === conversationId) {
              if (c.type === "group" && c.group) {
                return { ...c, group: { ...c.group, name: newName } };
              } else if (c.type === "direct" && targetUserId) {
                return {
                  ...c,
                  nicknames: { ...(c.nicknames || {}), [targetUserId]: newName },
                };
              }
            }
            return c;
          }),
        }));
      },
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({ conversations: state.conversations }),
    }
  )
);
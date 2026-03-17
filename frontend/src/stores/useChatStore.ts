import { chatService } from "@/services/chatService";
import type { ChatState } from "@/types/store"
import { create } from "zustand"
import { persist } from "zustand/middleware"
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
                    messageLoading: false
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
                const { user } = useAuthStore.getState(); // biết là ai đang đăng nhập

                const convoId = conversationId ?? activeConversationId;

                if (!convoId) return;

                const current = messages?.[convoId];
                const nextCursor = current?.nextCursor === undefined ? "" : current?.nextCursor;

                if (nextCursor === null) return; // nếu không có dòng này, app có thể fetch tin nhắn cũ, làm trùng tin nhắn

                set({ messageLoading: true });

                try {
                    const { messages: fetched, cursor } = await chatService.fetchMessages(convoId, nextCursor);
                    
                    const processed = fetched.map((m) => ({
                        ...m,
                        isOwn: m.senderId === user?._id,
                    }));

                    set((state) => {
                        const prev = state.messages[convoId]?.items ?? []; // lấy ds tin nhắn cũ ra trước
                        const merged = prev.length > 0 ? [...processed, ...prev] : processed; // đưa các tin nhắn mới lên đầu

                        return {
                            messages: {
                                ...state.messages,
                                [convoId]: {
                                    items: merged,
                                    hasMore: !!cursor,
                                    nextCursor: cursor ?? null,
                                }
                            }
                        }
                    })
                } catch (error) {
                    console.error("Error to fetchMessages: ", error);
                } finally {
                    set({ messageLoading: false });
                }
            },

            sendDirectMessage: async (recipientId, content, imgUrl) => {
                try {
                    const { activeConversationId } = get();
                    await chatService.sendDirectMessage(recipientId, content, imgUrl, activeConversationId || undefined);
                    
                    set((state) => ({
                        conversations: state.conversations.map((c) => c._id === activeConversationId ? {...c, seenBy: []} : c),
                    }))
                } catch (error) {
                    console.error("Error to sendDirectMessage.", error)
                }
             },
            
            sendGroupMessage: async (conversationId, content, imgUrl) => {
                try {
                    await chatService.sendGroupMessage(conversationId, content, imgUrl);
                    set((state) => ({
                        conversations: state.conversations.map((c) => c._id === get().activeConversationId ? {...c, seenBy: [] } : c),
                    }))
                } catch (error) {
                    console.error("Error to sendGroupMessage", error)
                }
            },
            addMessage: async (message) => {
                try {
                    const { user } = useAuthStore.getState();
                    const { fetchMessages } = get();

                    message.isOwn = message.senderId === user?._id;

                    const convoId = message.conversationId; // danh sách tin nhắn hiện có tron store

                    let prevItems = get().messages[convoId]?.items ?? []; // chứa các tin nhăn cũ
                    if (prevItems.length === 0) {
                        await fetchMessages(message.conversationId);
                        prevItems = get().messages[convoId]?.items ?? [];
                    }

                    set((state) => {
                        if (prevItems.some((m) => m._id === message._id)) {
                            return state
                        }

                        return {
                            messages: {
                                ...state.messages,
                                [convoId]: {
                                    items: [...prevItems, message],
                                    hasMore: state.messages[convoId].hasMore,
                                    nextCursor: state.messages[convoId].nextCursor ?? undefined
                                }
                            }
                        }
                    })
                } catch (error) {
                    console.error("Error to add message: ", error)
                }
            },

            updateConversation: async (conversation) => {
                set((state) => ({
                    conversations: state.conversations.map((c) => c._id === conversation._id ? {...c, ...conversation} : c)
                }))
            },

            markAsSeen: async () => {
                try {
                    const { user } = useAuthStore.getState();
                    const { activeConversationId, conversations } = get();

                    if (!activeConversationId || !user) { return; }
                    
                    const convo = conversations.find((c) => c._id === activeConversationId);

                    if (!convo) { return }

                    if ((convo.unreadCounts?.[user._id] ?? 0) === 0) {
                        return;
                    }

                    await chatService.markAsSeen(activeConversationId);

                    set((state) => ({
                        conversations: state.conversations.map((c) => (c._id === activeConversationId && c.lastMessage ? {
                            ...c,
                            unreadCounts: {
                                ...c.unreadCounts,
                                [user._id] : 0
                            }
                        } : c ))
                    }))
                } catch (error) {
                    console.error("Error to mark as seen in store.", error)
                }
            },

            addConvo: (convo) => {
                set((state) => {
                    const exists = state.conversations.some((c) => c._id.toString() === convo._id.toString());

                    return {
                        conversations: exists ? state.conversations : [convo, ...state.conversations],
                        activeConversationId: convo._id
                    }
                })
            },

            createConversation: async (type, name, memberIds) => {
                try {
                    set({ loading: true });
                    const conversation = await chatService.createConversation(type, name, memberIds);

                    get().addConvo(conversation);

                    useSocketStore.getState().socket?.emit("join-conversation", conversation._id)
                } catch (error) {
                    console.error("Error to call createConversation in store", error)
                } finally {
                    set({ loading: false });
                }
            }
        }),
        
        {
            name: "chat-storage",
            partialize: (state) => ({conversations: state.conversations}) // chỉ lưu conversation thôi
        }
    )
)
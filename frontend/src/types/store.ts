import type { Socket } from "socket.io-client";
import type { Conversation, Message } from "./chat";
import type { Friend, FriendRequest, User } from "./user";

export interface AuthState {
    accessToken: string | null;
    user: User | null;
    loading: boolean;

    setAccessToken: (accessToken: string) => void;
    setUser: (user: User) => void;

    clearState: () => void;

    signUp: (username: string, password: string, email: string, firstName: string, lastName: string) => Promise<void>;
    signIn: (username: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    fetchMe: () => Promise<void>;
    refresh: () => Promise<void>;
}

export interface ThemeState{
    isDark: boolean;
    toggleTheme: () => void; // hàm chuyển qua lại sáng tối
    setTheme: (dark: boolean) => void; // cài theme khi app vừa load
}

export interface ChatState{
    conversations: Conversation[];
    messages: Record<string, {
        items: Message[],
        hasMore: boolean, // infinite-scroll
        nextCursor?: string | null // phân trang
    }>; // map từng cuộc hội thoại với tin nhắn thuộc về hội thoại đó, xài Record
    activeConversationId: string | null;
    convoLoading: boolean; // theo dõi trạng thái request đã hoàn thành chưa
    messageLoading: boolean;
    loading: boolean;
    reset: () => void;

    setActiveConversation: (id: string | null) => void; // components khác cập nhật giá trị của conversation
    fetchConversations: () => Promise<void>;
    fetchMessages: (conversationId?: string) => Promise<void>;

    sendDirectMessage: (
        recipientId: string,
        content: string,
        imgUrl?: string
    ) => Promise<void>;

    sendGroupMessage: (
        conversationId: string,
        content: string,
        imgUrl?: string
    ) => Promise<void>;

    // add message
    addMessage: (message: Message) => Promise<void>;

    // update convo
    updateConversation: (conversation: unknown) => void;

    // markasseen
    markAsSeen: () => Promise<void>;

    addConvo: (convo: Conversation) => void;

    createConversation: (type: "direct" | "group", name: string, memberIds: string[]) => Promise<void>;
};

export interface SocketState {
    socket: Socket | null;
    onlineUsers: string[]; // đại diện cho toàn bộ users đang onl
    connectSocket: () => void;
    disconnectSocket: () => void
};

export interface FriendState{
    friends: Friend[];
    loading: boolean;
    receivedList: FriendRequest[];
    sentList: FriendRequest[];
    searchByUsername: (username: string) => Promise<User | null>;
    addFriend: (to: string, message?: string) => Promise<string>;
    getAllFriendRequests: () => Promise<void>;
    acceptRequest: (requestId: string) => Promise<void>;
    declineRequest: (requestId: string) => Promise<void>;
    getFriends: () => Promise<void>;
};

export interface UserState{
    updateAvatarUrl: (formData: FormData) => Promise<void>;
}
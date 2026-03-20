import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import { useAuthStore } from "./useAuthStore";
import { useChatStore } from "./useChatStore";
import { useFriendStore } from "./useFriendStore";
import type { SocketState } from "@/types/store";
import type { FriendRequest } from "@/types/user";

const baseURL = import.meta.env.VITE_SOCKET_URL;

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  onlineUsers: [],

  connectSocket: () => {
    const accessToken = useAuthStore.getState().accessToken;
    const existingSocket = get().socket;

    if (existingSocket) return;

    const socket: Socket = io(baseURL, {
      auth: { token: accessToken },
      transports: ["websocket"],
    });

    set({ socket });

    socket.on("connect", () => {
      console.log("Connected to socket successfully.");
    });

    socket.on("online-users", (userIds) => {
      set({ onlineUsers: userIds });
    });

    socket.on("new-message", async ({ message, conversation, unreadCounts }) => {
      let chatStore = useChatStore.getState();

      const convoExists = chatStore.conversations.some(
        (c) => c._id === conversation._id
      );

      if (!convoExists) {
        socket.emit("join-conversation", conversation._id);

        await chatStore.fetchConversations();
        chatStore = useChatStore.getState();
      }

      chatStore.addMessage(message);

      const prevConvo = chatStore.conversations.find(
        (c) => c._id === conversation._id
      );

      const rawSenderId = conversation?.lastMessage?.senderId;
      const senderId =
        typeof rawSenderId === "string" ? rawSenderId : rawSenderId?._id;

      const senderProfile = prevConvo?.participants?.find(
        (p) => p._id === senderId
      );

      const normalizedLastMessage = {
        _id: conversation?.lastMessage?._id,
        content: conversation?.lastMessage?.content ?? null,
        imgUrl: conversation?.lastMessage?.imgUrl ?? null,
        createdAt: conversation?.lastMessage?.createdAt,
        senderId,
        sender: senderId
          ? {
              _id: senderId,
              displayName: senderProfile?.displayName ?? "",
              avatarUrl: senderProfile?.avatarUrl ?? null,
            }
          : null,
      };

      const updatedConversation = {
        ...conversation,
        lastMessage: normalizedLastMessage,
        unreadCounts,
      };

      if (chatStore.activeConversationId === message.conversationId) {
        chatStore.markAsSeen();
      }

      chatStore.updateConversation(updatedConversation);
    });

    socket.on("read-message", ({ conversation, lastMessage }) => {
      const chatStore = useChatStore.getState();
      const prev = chatStore.conversations.find((c) => c._id === conversation._id);

      const mergedLastMessage = {
        ...(prev?.lastMessage || {}),
        ...(lastMessage || {}),
        sender: {
          ...((prev?.lastMessage as any)?.sender || {}),
          ...((lastMessage as any)?.sender || {}),
        },
      };

      const updated = {
        _id: conversation._id,
        lastMessage: mergedLastMessage,
        lastMessageAt: conversation.lastMessageAt,
        unreadCounts: conversation.unreadCounts,
        seenBy: conversation.seenBy,
      };

      chatStore.updateConversation(updated);
    });

    socket.on("new-group", (conversation) => {
      useChatStore.getState().addConvo(conversation);
      socket.emit("join-conversation", conversation._id);
    });

    socket.on("conversation-renamed", (data) => {
      useChatStore.getState().updateConversationNameLocally(
        data.conversationId,
        data.newName,
        data.targetUserId
      );
    });

    socket.on("conversations-removed", ({ conversationIds }: { conversationIds: string[] }) => {
      const ids = new Set(conversationIds);
      const chatStore = useChatStore.getState();

      const nextConversations = chatStore.conversations.filter((c) => !ids.has(c._id));

      const nextMessages = { ...chatStore.messages };
      conversationIds.forEach((id) => {
        delete nextMessages[id];
      });

      useChatStore.setState({
        conversations: nextConversations,
        messages: nextMessages,
        activeConversationId:
          chatStore.activeConversationId && ids.has(chatStore.activeConversationId)
            ? null
            : chatStore.activeConversationId,
      });
    });

    socket.on("conversation-block-status-changed", async () => {
      await useChatStore.getState().fetchConversations();
    });

    socket.on(
      "friend-request-received",
      async ({ request }: { request: FriendRequest }) => {
        await useFriendStore.getState().getAllFriendRequests();

        const senderName =
          request?.from?.displayName ||
          request?.from?.username ||
          "Someone";

        toast.success(senderName + " sent you a friend request");
      }
    );

    socket.on(
      "friend-request-accepted",
      async ({ requestId }: { requestId: string }) => {
        void requestId;
        await useFriendStore.getState().getAllFriendRequests();
      }
    );

    socket.on(
      "friend-request-declined",
      async ({ requestId }: { requestId: string }) => {
        void requestId;
        await useFriendStore.getState().getAllFriendRequests();
      }
    );
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.off("online-users");
      socket.off("new-message");
      socket.off("read-message");
      socket.off("new-group");
      socket.off("conversation-renamed");
      socket.off("conversations-removed");
      socket.off("conversation-block-status-changed");
      socket.off("friend-request-received");
      socket.off("friend-request-accepted");
      socket.off("friend-request-declined");
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
export const updateConversationAfterCreateMessage = (conversation, message, senderId) => {
    conversation.set({
        seenBy: [],
        lastMessageAt: message.createdAt,
        lastMessage: {
            _id: message._id,
            content: message.content,
            imgUrl: message.imgUrl ?? null,
            senderId,
            createdAt: message.createdAt
        }
    });

    conversation.participants.forEach((p) => {
        const memberId = p.userId.toString();
        const isSender = memberId === senderId.toString();
        const prevCount = conversation.unreadCounts.get(memberId) || 0;
        conversation.unreadCounts.set(memberId, isSender ? 0 : prevCount + 1)
    })
};

export const emitNewMessage = (io, conversation, message, options = {}) => {
  const { notifyUserIds = [] } = options;

  const payload = {
    message,
    conversation: {
      _id: conversation._id,
      lastMessage: conversation.lastMessage,
      lastMessageAt: conversation.lastMessageAt,
    },
    unreadCounts: Object.fromEntries(conversation.unreadCounts || new Map()),
  };

  // Normal path: emit to conversation room
  io.to(conversation._id.toString()).emit("new-message", payload);

  // Fallback path for first message of brand-new conversation
  notifyUserIds.forEach((userId) => {
    io.to(userId.toString()).emit("new-message", payload);
  });
};
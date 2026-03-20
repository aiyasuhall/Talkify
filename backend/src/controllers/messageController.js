import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { io } from "../socket/index.js";
import { emitNewMessage, updateConversationAfterCreateMessage } from "../utils/messageHelper.js";
import { uploadChatImage } from "../middlewares/uploadMiddleware.js";

export const sendDirectMessage = async (req, res) => {
  try {
    const { recipientId, content, conversationId } = req.body;
    const senderId = req.user._id;

    let imgUrl = null;
    if (req.file) {
      const result = await uploadChatImage(req.file.buffer);
      imgUrl = result.secure_url;
    }

    if (!content && !imgUrl) {
      return res.status(400).json({ message: "Missing content." });
    }

    let conversation = null;

    if (conversationId) {
      conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found." });
      }
    } else {
      if (!recipientId) {
        return res.status(400).json({ message: "Recipient is required." });
      }

      conversation = await Conversation.create({
        type: "direct",
        participants: [
          { userId: senderId, joinedAt: new Date() },
          { userId: recipientId, joinedAt: new Date() },
        ],
        lastMessageAt: new Date(),
        unreadCounts: new Map(),
      });
    }

    // Cover cả case conversation có sẵn nhưng chưa từng có lastMessage
    const hadLastMessageBeforeSend = Boolean(
      conversation.lastMessage && conversation.lastMessage._id
    );

    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      content,
      imgUrl,
    });

    updateConversationAfterCreateMessage(conversation, message, senderId);
    conversation.deletedBy = [];

    await conversation.save();

    const notifyUserIds = !hadLastMessageBeforeSend
      ? conversation.participants
          .map((p) => p.userId?.toString())
          .filter((id) => id && id !== senderId.toString())
      : [];

    emitNewMessage(io, conversation, message, { notifyUserIds });

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Error to send direct message.", error);
    return res.status(500).json({ message: "System error." });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const senderId = req.user._id;
    const conversation = req.conversation;

    let imgUrl = null;
    if (req.file) {
      const result = await uploadChatImage(req.file.buffer);
      imgUrl = result.secure_url;
    }

    if (!content && !imgUrl) {
      return res.status(400).json({ message: "Missing content." });
    }

    const message = await Message.create({
      conversationId,
      senderId,
      content,
      imgUrl,
    });

    updateConversationAfterCreateMessage(conversation, message, senderId);
    conversation.deletedBy = [];

    await conversation.save();

    emitNewMessage(io, conversation, message);

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Error to send message to group", error);
    return res.status(500).json({ message: "System error." });
  }
};
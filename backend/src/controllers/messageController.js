import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js"
import { updateConversationAfterCreateMessage } from "../utils/messageHelper.js";

export const sendDirectMessage = async (req, res) => {
    try {
        const { recipientId, content, conversationId } = req.body;
        const senderId = req.user._id;

        let conversation; // lưu lại thông tin cuộc trò chuyện

        if (!content) {
            return res.status(400).json({message: "Missing content."}) // tin nhắn trống
        }

        if (conversationId) {
            conversation = await Conversation.findById(conversationId)
        }

        if (!conversationId) {
            conversation = await Conversation.create({
                type: "direct",
                participants: [
                    { userId: senderId, joinedAt: new Date() },
                    { userId: recipientId, joinedAt: new Date() }
                ],
                lastMessageAt: new Date(),
                unreadCounts: new Map()
            });
        }

        const message = await Message.create({
            conversationId: conversation._id,
            senderId,
            content
        });

        updateConversationAfterCreateMessage(conversation, message, senderId);
        
        await conversation.save(); // lưu lại thay đổi
        
        return res.status(201).json({message})
    } catch (error) {
        console.error("Error to send direct message.", error);
        return res.status(500).json({message: "System error."})
    }
};

export const sendGroupMessage = async (req, res) => {
    try {
        const { conversationId, content } = req.body;
        const senderId = req.user._id;
        const conversation = req.conversation;

        if (!content) {
            return res.status(400).json("Missing content.");
        }

        const message = await Message.create({
            conversationId,
            senderId,
            content
        });

        updateConversationAfterCreateMessage(conversation, message, senderId);
        
        await conversation.save();

        return res.status(201).json({ message });
    } catch (error) {
        console.error("Error to send message to group", error);
        return res.status(500).json({message: "System error."})
    }
};
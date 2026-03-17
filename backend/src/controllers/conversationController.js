import Conversation from "../models/Conversation.js"
import Message from "../models/Message.js"
import { io } from "../socket/index.js";

export const createConversation = async (req, res) => {
    try {
        const { type, name, memberIds } = req.body;
        const userId = req.user._id;

        if (!type || type === "group" && !name || !memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
            return res.status(400).json({ message: "Group name and list of members is compulsory." });
        }

        let conversation;
        
        // kiểm tra cuộc trò chuyện tồn tại chưa
        if (type === "direct") {
            const participantId = memberIds[0];

            conversation = await Conversation.findOne({
                type: "direct",
                "participants.userId": { $all: [userId, participantId], } // cách truy vấn vào mảng trong mongoDB => kiểm tra 2 user đã có cuộc trò chuyện, để có rồi thì không phải tạo conversation
            });

            if (!conversation) {
                conversation = new Conversation({
                    type: "direct",
                    participants: [{ userId }, { userId: participantId }],
                    lastMessageAt: new Date()
                });

                await conversation.save();
            }
        }

        // tạo nhóm chat
        if (type === "group") {
            conversation = new Conversation({
                type: "group",
                participants: [
                    { userId },
                    ...memberIds.map((id) => ({ userId: id }))
                ],
                group: {
                    name,
                    createdBy: userId
                },

                lastMessageAt: new Date()
            });

            await conversation.save();
        }

        if (!conversation) {
            return res.status(400).json({ message: "Conversation type is invalid." })
        }

        // nạp thêm thông tin người dùng cho các trường liên quan
        await conversation.populate([
            { path: "participants.userId", select: "displayName avatarUrl" },
            {
                path: "seenBy",
                select: "displayName avatarUrl"
            },
            { path: "lastMessage.senderId", select: "displayName avatarUrl" }
        ]);
        const participants = (conversation.participants || []).map((p) => ({
            _id: p.userId?._id,
            displayName: p.userId?.displayName,
            avatarUrl: p.userId?.avatarUrl ?? null,
            joinedAt: p.joinedAt,
        }));

        const formatted = { ...conversation.toObject(), participants };

        // emit cho từng thành viên có trong group
        if (type === "group") {
            memberIds.forEach((userId) => {
                io.to(userId).emit("new-group", formatted)
            })
        }

        // Sửa dòng return cuối cùng:
        return res.status(201).json({ conversation: formatted });
    } catch (error) {
        console.error("Error to create conversation", error);
        return res.status(500).json({ message: "System error." })
    }
};

export const getConversation = async (req, res) => {
    try {
        const userId = req.user._id;
        const conversations = await Conversation.find({
            "participants.userId": userId
        })
            .sort({ lastMessageAt: -1, updatedAt: -1 })
            .populate({
                path: "participants.userId",
                select: "displayName avatarUrl"
            })
            .populate({
                path: "lastMessage.senderId",
                select: "displayName avatarUrl"
            })
            .populate({
                path: "seenBy",
                select: "displayName avatarUrl"
            });
        
        // duyệt qua từng cuộc trò chuyện, tạo 1 mảng, trong mảng là các thông tin đã format lại để front end dễ dùng hơn
        const formatted = conversations.map((convo) => {
            const participants = (convo.participants || []).map((p) => ({
                _id: p.userId?._id,
                displayName: p.userId?.displayName,
                avatarUrl: p.userId?.avatarUrl ?? null,
                joinedAt: p.joinedAt
            }));

            return {
                ...convo.toObject(), // chuyển mongoose docu thành đối tượng js
                unreadCounts: convo.unreadCounts || {},
                participants
            };
        });
        return res.status(200).json({ conversations: formatted });
    } catch (error) {
        console.error("Error to get conversations", error);
        return res.status(500).json({ message: "System error." })
    }
};

export const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { limit = 50, cursor } = req.query;

        const query = { conversationId };

        if (cursor) {
            query.createdAt = { $lt: new Date(cursor) }
        }

        let messages = await Message.find(query)
            .sort({ createdAt: -1 })   // sắp xếp tin mới nhất
            .limit(Number(limit) + 1); // chuyển limit thành dạng số
        
        // kiểm tra còn trang kế tiếp không
        let nextCursor = null;
        
        if (messages.length > Number(limit)) {
            const nextMessage = messages[messages.length - 1];
            nextCursor = nextMessage.createdAt.toISOString(); // đánh dấu vị trí phân trang tiếp theo
            // ví dụ limit là 50, query trả về là 51 tin nhắn, thì lấy cái thời gian tạo của tin thứ 51 để là nextCursor
            messages.pop();
        }

        messages = messages.reverse(); // lúc sort thì tin mới nhất được xếp lên đầu => đảo ngược lại để tin mới nhất nằm cuối
        
        return res.status(200).json({ messages, nextCursor })
    } catch (error) {
        console.error("Error to get messages.", error);
        return res.status(500).json({ message: "System error." })
    }
};

export const getUserConversationsForSocketIO = async (userId) => {
    try {
        const conversations = await Conversation.find(
            { "participants.userId": userId },
            { _id: 1 }
        );

        return conversations.map((c) => c._id.toString());
    } catch (error) {
        console.error("Error to fetch conversations: ", error)
        return [];
    }
};

export const markAsSeen = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id.toString();

        const conversation = await Conversation.findById(conversationId).lean();

        if (!conversation) {
            return res.status(404).json({message: "Conversation is not exist."})
        }

        // nếu có conversation, lấy tin nhắn cuối cùng của convo ra
        const last = conversation.lastMessage;

        if (!last) {
            return res.status(200).json({message: "No messages to mark as seen."})
        }

        if (last.senderId.toString() === userId) {
            return res.status(200).json({message: "Sender does not need to mark as seen."})
        }

        // update số tin nhắn chưa đọc về 0 khi user đã đọc tin nhắn
        const updated = await Conversation.findByIdAndUpdate(
            conversationId,
            {
                $addToSet: { seenBy: userId },
                $set: { [`unreadCounts.${userId}`]: 0 }
            },
            {
                new: true,
            }
        );

        io.to(conversationId).emit("read-message", {
            conversation: updated,
            lastMessage: {
                _id: updated?.lastMessage._id,
                content: updated?.lastMessage.content,
                createdAt: updated?.lastMessage.createdAt,
                sender: {
                    _id: updated?.lastMessage.senderId,
                }
            }
        });

        return res.status(200).json({
            message: "Marked as seen",
            seenBy: updated?.seenBy || [],
            myUnreadCount: updated?.unreadCounts[userId] || 0
        })
    } catch (error) {
        console.error("Error to mark as seen.", error);
        return res.status(500).json({message: "System error."})
    }
}
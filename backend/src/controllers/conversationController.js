import Conversation from "../models/Conversation.js"
import Message from "../models/Message.js"
import { io } from "../socket/index.js";
import User from "../models/User.js";

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
        const userIdStr = userId.toString();

        const conversations = await Conversation.find({
            "participants.userId": userId,
            deletedBy: { $ne: req.user._id }
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

        const allParticipantIds = Array.from(
            new Set(
                conversations.flatMap((c) =>
                    (c.participants || []).map((p) =>
                        p.userId?._id?.toString() || p.userId?.toString()
                    )
                )
            )
        ).filter(Boolean);

        const users = await User.find({ _id: { $in: allParticipantIds } })
            .select("_id blockedUsers")
            .lean();

        const blockedMap = new Map(
            users.map((u) => [
                u._id.toString(),
                new Set((u.blockedUsers || []).map((id) => id.toString()))
            ])
        );

        const formatted = conversations.map((convo) => {
            const participants = (convo.participants || []).map((p) => ({
                _id: p.userId?._id,
                displayName: p.userId?.displayName,
                avatarUrl: p.userId?.avatarUrl ?? null,
                joinedAt: p.joinedAt
            }));

            const convoObj = convo.toObject();

            const lastMessage = convo.lastMessage
                ? {
                    _id: convo.lastMessage._id,
                    content: convo.lastMessage.content ?? null,
                    imgUrl: convo.lastMessage.imgUrl ?? null,
                    createdAt: convo.lastMessage.createdAt ?? null,
                    senderId:
                        convo.lastMessage.senderId?._id ||
                        convo.lastMessage.senderId ||
                        null,
                    sender: convo.lastMessage.senderId
                        ? {
                            _id: convo.lastMessage.senderId._id,
                            displayName: convo.lastMessage.senderId.displayName ?? "",
                            avatarUrl: convo.lastMessage.senderId.avatarUrl ?? null
                        }
                        : null
                }
                : null;

            let isBlocked = false;
            let isBlockedByMe = false;
            let isBlockedByOther = false;

            if (convo.type === "direct") {
                const other = participants.find(
                    (p) => p._id?.toString() !== userIdStr
                );
                const otherId = other?._id?.toString();

                if (otherId) {
                    const myBlocked = blockedMap.get(userIdStr) || new Set();
                    const theirBlocked = blockedMap.get(otherId) || new Set();

                    isBlockedByMe = myBlocked.has(otherId);
                    isBlockedByOther = theirBlocked.has(userIdStr);
                    isBlocked = isBlockedByMe || isBlockedByOther;
                }
            }

            return {
                ...convoObj,
                lastMessage,
                isBlocked,
                isBlockedByMe,
                isBlockedByOther,
                unreadCounts: Object.fromEntries(convoObj.unreadCounts || new Map()),
                nicknames: Object.fromEntries(convoObj.nicknames || new Map()),
                participants
            };
        });

        return res.status(200).json({ conversations: formatted });
    } catch (error) {
        console.error("Error to get conversations", error);
        return res.status(500).json({ message: "System error." });
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
            return res.status(404).json({ message: "Conversation is not exist." })
        }

        // nếu có conversation, lấy tin nhắn cuối cùng của convo ra
        const last = conversation.lastMessage;

        if (!last) {
            return res.status(200).json({ message: "No messages to mark as seen." })
        }

        if (last.senderId.toString() === userId) {
            return res.status(200).json({ message: "Sender does not need to mark as seen." })
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
                imgUrl: updated?.lastMessage.imgUrl ?? null,
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
        return res.status(500).json({ message: "System error." })
    }
};

export const renameConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { newName, targetUserId } = req.body;

        console.log("=== RENAME DEBUG ===");
        console.log("conversationId:", conversationId);
        console.log("newName:", newName);
        console.log("targetUserId:", targetUserId);
        console.log("req.body:", req.body);

        const conversation = await Conversation.findById(conversationId);
        console.log("Found conversation type:", conversation?.type);
        console.log("Current nicknames:", conversation?.nicknames);
        
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found." });
        }

        let updated;

        if (conversation.type === "group") {
            console.log("Updating GROUP name...");
            updated = await Conversation.findByIdAndUpdate(
                conversationId,
                { $set: { "group.name": newName } },
                { new: true }
            );
        } else if (conversation.type === "direct") {
            if (!targetUserId) {
                console.log("ERROR: targetUserId missing!");
                return res.status(400).json({ message: "targetUserId is required for direct messages." });
            }
            console.log(`Updating DIRECT nickname for ${targetUserId} to "${newName}"...`);
            updated = await Conversation.findByIdAndUpdate(
                conversationId,
                { $set: { [`nicknames.${targetUserId}`]: newName } },
                { new: true }
            );
            console.log("After update, nicknames:", updated?.nicknames);
        }

        console.log("Updated conversation:", updated);

        io.to(conversationId).emit("conversation-renamed", {
            conversationId,
            newName,
            targetUserId,
            type: conversation.type
        });

        return res.status(200).json({ message: "Renamed successfully", conversation: updated });
    } catch (error) {
        console.error("ERROR in renameConversation:", error);
        return res.status(500).json({ message: "System error." });
    }
};

export const deleteConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found." });
        }

        // Nếu ID chưa có trong mảng thì thêm vào
        if (!conversation.deletedBy.includes(userId)) {
            conversation.deletedBy.push(userId);
            await conversation.save();
        }

        return res.status(200).json({ message: "Conversation deleted successfully", conversationId });
    } catch (error) {
        console.error("Error to delete conversation.", error);
        return res.status(500).json({ message: "System error." });
    }
}
import { uploadImageFromBuffer } from "../middlewares/uploadMiddleware.js";
import User from "../models/User.js";
import Friend from "../models/Friend.js";
import FriendRequest from "../models/FriendRequest.js";
import bcrypt from "bcrypt";
import Session from "../models/Session.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { io } from "../socket/index.js";

export const authMe = async (req, res) => {
    try {
        const user = req.user // lấy từ middleware
        return res.status(200).json(user)
    } catch (error) {
        console.error("Error to call authMe", error);
        return res.status(500).json({ message: "System error." })
    }
};

export const searchUserByUsername = async (req, res) => {
    try {
        const { username } = req.query;

        if (!username || username.trim() === "") {
            return res.status(400).json({ message: "Need to provide username in query." });
        }

        const user = await User.findOne({ username }).select(
            "_id displayName username avatarUrl"
        );

        return res.status(200).json({ user })
    } catch (error) {
        console.error("Error to searchUserByUsername", error);
        return res.status(500).json({ message: "System error." })
    }
};

export const uploadAvatar = async (req, res) => {
    try {
        const file = req.file;
        const userId = req.user._id;

        if (!file) {
            return res.status(400).json({ message: "No file uploaded." })
        }

        const result = await uploadImageFromBuffer(file.buffer); // file.buffer là data multer đã lưu trong bộ nhớ

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                avatarUrl: result.secure_url,
                avatarId: result.public_id,
            },

            {
                new: true, // trả về user đã cập nhật
            }
        ).select("avatarUrl"); // trả lại đúng data frontend cần

        if (!updatedUser.avatarUrl) {
            return res.status(400).json({ message: "Avatar returns null." })
        }

        return res.status(200).json({ avatarUrl: updatedUser.avatarUrl });
    } catch (error) {
        console.error("Error to upload avatar.", error);
        return res.status(500).json({ message: "Upload failed." })
    }
};

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { displayName, email, phone, bio } = req.body;

        const payload = {
            displayName: displayName?.trim(),
            email: email?.trim().toLowerCase(),
            phone: phone?.trim(),
            bio: bio?.trim(),
        };

        if (!payload.displayName || !payload.email) {
            return res.status(400).json({ message: "Display name and email are required." });
        }

        const duplicateEmail = await User.findOne({
            email: payload.email,
            _id: { $ne: userId }
        });

        if (duplicateEmail) {
            return res.status(409).json({ message: "Email is already in use." });
        }

        const updated = await User.findByIdAndUpdate(userId, payload, { new: true }).select("-hashedPassword");
        return res.status(200).json({ user: updated });
    } catch (error) {
        console.error("Error to updateProfile", error);
        return res.status(500).json({ message: "System error." });
    }
};

export const updatePreferences = async (req, res) => {
    try {
        const userId = req.user._id;
        const { showOnlineStatus } = req.body;

        const updated = await User.findByIdAndUpdate(
            userId,
            { showOnlineStatus: !!showOnlineStatus },
            { new: true }
        ).select("-hashedPassword");

        return res.status(200).json({ user: updated });
    } catch (error) {
        console.error("Error to updatePreferences", error);
        return res.status(500).json({ message: "System error." });
    }
};

export const changePassword = async (req, res) => {
    try {
        const userId = req.user._id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Current password and new password are required." });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters." });
        }

        const user = await User.findById(userId);
        const ok = await bcrypt.compare(currentPassword, user.hashedPassword);

        if (!ok) {
            return res.status(401).json({ message: "Current password is incorrect." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate(userId, { hashedPassword });

        return res.status(200).json({ message: "Password changed successfully." });
    } catch (error) {
        console.error("Error to changePassword", error);
        return res.status(500).json({ message: "System error." });
    }
};

export const blockUser = async (req, res) => {
    try {
        const me = req.user._id;
        const { targetUserId } = req.params;

        if (!targetUserId) {
            return res.status(400).json({ message: "Missing target user id." });
        }

        if (me.toString() === targetUserId.toString()) {
            return res.status(400).json({ message: "You cannot block yourself." });
        }

        const target = await User.findById(targetUserId);
        if (!target) {
            return res.status(404).json({ message: "Target user not found." });
        }

        await User.findByIdAndUpdate(me, { $addToSet: { blockedUsers: targetUserId } });

        // remove friend relationship + friend requests between 2 users
        const a = me.toString();
        const b = targetUserId.toString();
        const [userA, userB] = a < b ? [a, b] : [b, a];

        await Promise.all([
            Friend.deleteOne({ userA, userB }),
            FriendRequest.deleteMany({
                $or: [
                    { from: me, to: targetUserId },
                    { from: targetUserId, to: me }
                ]
            })
        ]);

        io.to(me.toString()).emit("conversation-block-status-changed", {
        targetUserId: targetUserId.toString(),
        });

        io.to(targetUserId.toString()).emit("conversation-block-status-changed", {
        targetUserId: me.toString(),
        });

        return res.status(200).json({ message: "User blocked successfully." });
    } catch (error) {
        console.error("Error to blockUser", error);
        return res.status(500).json({ message: "System error." });
    }
};

export const unblockUser = async (req, res) => {
    try {
        const me = req.user._id;
        const { targetUserId } = req.params;

        await User.findByIdAndUpdate(me, { $pull: { blockedUsers: targetUserId } });

        const directConversations = await Conversation.find({
            type: "direct",
            "participants.userId": { $all: [me, targetUserId] }
        }).select("_id");

        const convoIds = directConversations.map((c) => c._id);
        const conversationIds = convoIds.map((id) => id.toString());

        if (convoIds.length > 0) {
            await Message.deleteMany({ conversationId: { $in: convoIds } });
            await Conversation.deleteMany({ _id: { $in: convoIds } });

            // Realtime remove on both clients
            io.to(me.toString()).emit("conversations-removed", { conversationIds });
            io.to(targetUserId.toString()).emit("conversations-removed", { conversationIds });
        }

        // Realtime refresh block status on both clients
        io.to(me.toString()).emit("conversation-block-status-changed", {
            targetUserId: targetUserId.toString(),
        });

        io.to(targetUserId.toString()).emit("conversation-block-status-changed", {
            targetUserId: me.toString(),
        });

        return res.status(200).json({
            message: "User unblocked successfully. Direct conversations removed."
        });
    } catch (error) {
        console.error("Error to unblockUser", error);
        return res.status(500).json({ message: "System error." });
    }
};

export const getBlockedUsers = async (req, res) => {
    try {
        const me = req.user._id.toString();
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);

        const meDoc = await User.findById(me).select("blockedUsers").lean();

        const uniqueIds = [...new Set((meDoc?.blockedUsers || []).map((id) => id.toString()))]
            .filter((id) => id !== me);

        const start = (page - 1) * limit;
        const pagedIds = uniqueIds.slice(start, start + limit);

        if (!pagedIds.length) {
            return res.status(200).json({
                blockedUsers: [],
                total: uniqueIds.length,
                page,
                limit,
                hasMore: false
            });
        }

        const docs = await User.find({ _id: { $in: pagedIds } })
            .select("_id username displayName avatarUrl")
            .lean();

        const byId = new Map(docs.map((u) => [u._id.toString(), u]));
        const blockedUsers = pagedIds.map((id) => byId.get(id)).filter(Boolean);

        return res.status(200).json({
            blockedUsers,
            total: uniqueIds.length,
            page,
            limit,
            hasMore: start + limit < uniqueIds.length
        });
    } catch (error) {
        console.error("Error to getBlockedUsers", error);
        return res.status(500).json({ message: "System error." });
    }
};

export const deleteAccount = async (req, res) => {
    try {
        const me = req.user._id;
        const meStr = me.toString();
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: "Password is required to delete account." });
        }

        const user = await User.findById(me);
        const ok = await bcrypt.compare(password, user.hashedPassword);

        if (!ok) {
            return res.status(401).json({ message: "Password is incorrect." });
        }

        // delete sessions
        await Session.deleteMany({ userId: me });

        // remove friends + friend requests
        await Promise.all([
            Friend.deleteMany({ $or: [{ userA: me }, { userB: me }] }),
            FriendRequest.deleteMany({ $or: [{ from: me }, { to: me }] })
        ]);

        const convos = await Conversation.find({ "participants.userId": me });

        const directConvos = convos.filter((c) => c.type === "direct");
        const groupConvos = convos.filter((c) => c.type === "group");

        // 1) DIRECT: delete conversation + messages
        const directIds = directConvos.map((c) => c._id);
        const directIdStrings = directIds.map((id) => id.toString());

        if (directIds.length > 0) {
            await Message.deleteMany({ conversationId: { $in: directIds } });
            await Conversation.deleteMany({ _id: { $in: directIds } });

            const directOtherUserIds = new Set();
            directConvos.forEach((c) => {
                (c.participants || []).forEach((p) => {
                    const id = p.userId?.toString();
                    if (id && id !== meStr) {
                        directOtherUserIds.add(id);
                    }
                });
            });

            directOtherUserIds.forEach((id) => {
                io.to(id).emit("conversations-removed", { conversationIds: directIdStrings });
            });
        }

        // 2) GROUP: keep conversation, anonymize deleted user's messages
        const affectedGroupMemberIds = new Set();

        for (const convo of groupConvos) {
            // Replace all messages sent by deleted user in this group
            await Message.updateMany(
                { conversationId: convo._id, senderId: me },
                { $set: { content: "This user is deleted!", imgUrl: null } }
            );

            // Realtime notify group members about message anonymization
            io.to(convo._id.toString()).emit("messages-anonymized", {
                conversationId: convo._id.toString(),
                deletedUserId: meStr
            });

            // If last message belongs to deleted user, update snapshot
            if (convo.lastMessage?.senderId?.toString() === meStr) {
                convo.lastMessage.content = "This user is deleted!";
                convo.lastMessage.imgUrl = null;
                convo.lastMessage.senderId = null;
            }

            // Remove deleted user from group participant-related data
            convo.participants = (convo.participants || []).filter(
                (p) => p.userId.toString() !== meStr
            );
            convo.seenBy = (convo.seenBy || []).filter((id) => id.toString() !== meStr);
            convo.deletedBy = (convo.deletedBy || []).filter((id) => id.toString() !== meStr);

            if (convo.unreadCounts instanceof Map) convo.unreadCounts.delete(meStr);
            if (convo.nicknames instanceof Map) convo.nicknames.delete(meStr);

            if (!convo.participants.length) {
                // no members left => remove empty group + its messages
                await Message.deleteMany({ conversationId: convo._id });
                await Conversation.findByIdAndDelete(convo._id);
            } else {
                await convo.save();

                convo.participants.forEach((p) => {
                    const id = p.userId?.toString();
                    if (id && id !== meStr) {
                        affectedGroupMemberIds.add(id);
                    }
                });
            }
        }

        // Ask group members to refresh conversations (listener already exists on frontend)
        affectedGroupMemberIds.forEach((id) => {
            io.to(id).emit("conversation-block-status-changed", {
                targetUserId: meStr
            });
        });

        await User.findByIdAndDelete(me);
        res.clearCookie("refreshToken");

        return res.status(200).json({ message: "Account deleted successfully." });
    } catch (error) {
        console.error("Error to deleteAccount", error);
        return res.status(500).json({ message: "System error." });
    }
};
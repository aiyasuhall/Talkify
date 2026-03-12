// check xem có là bạn bè chưa, thì mới gửi tin nhắn cho nhau được
import Conversation from "../models/Conversation.js";
import Friend from "../models/Friend.js";

const pair = (a, b) => (a < b ? [a, b] : [b, a]); // hoán đổi a và b, nếu a lớn hơn b

export const checkFriendship = async (req, res, next) => {
    try {
        const me = req.user._id.toString();

        const recipientId = req.body?.recipientId ?? null; // ?? sẽ kiểm tra vế bên trái có phải null hay undefined => đúng thì lấy giá trị bên phải

        // tạo nhóm với những người đã là bạn bè
        const memberIds = req.body?.memberIds ?? [];
        if (!recipientId && memberIds.length === 0) {
            return res.status(400).json({ message: "Need to provide recipientId or memberIds" });
        }

        if (recipientId) {
            const [userA, userB] = pair(me, recipientId);

            const isFriend = await Friend.findOne({ userA, userB });

            if (!isFriend) {
                return res.status(403).json({ message: "You haven't befriended this person yet. " })
            }

            return next();
        }

        //todo: chat nhóm
        // duyện qua từng member id
        const friendChecks = memberIds.map(async (memberId) => {
            const [userA, userB] = pair(me, memberId); // chuẩn hóa thứ tự 2 user
            const friend = await Friend.findOne({ userA, userB });
            return friend ? null : memberId
        });

        const results = await Promise.all(friendChecks); // lưu kết quả
        const notFriends = results.filter(Boolean);

        if (notFriends.length > 0) {
            return res.status(403).json({ message: "You can only add your friends to group", notFriends })
        }

        next();
    } catch (error) {
        console.error("Error to check friendship.", error);
        return res.status(500).json({ message: "System error." })
    }
};

export const checkGroupMembership = async(req, res, next) => {
    try {
        const { conversationId } = req.body;
        const userId = req.user._id;

        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({message: "Conversation not found."})
        }

        const isMember = conversation.participants.some(
            (p) => p.userId.toString() === userId.toString()
        );

        if (!isMember) {
            return res.status(403).json({message: "You are not member in this group."})
        }

        req.conversation = conversation;
        next();

    } catch (error) {
        console.error("Error to check group membership.");
        return res.status(500).json({message: "System error."})
    }
}
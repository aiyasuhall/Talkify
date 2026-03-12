import mongoose from "mongoose"

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true,
        index: true
    },

    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    content: {
        type: String,
        trim: true
    },

    imgUrl: {
        type: String
    },
}, {
    timestamps: true // tự động createdAt & updatedAt
});

messageSchema.index({ conversationId: 1, createdAt: -1 }); // index nhiều trường
// tin nhắn từ mới tới cũ khi truy vấn

const Message = mongoose.model("Message", messageSchema);

export default Message 
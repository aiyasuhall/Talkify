import mongoose from "mongoose"

const friendRequestSchema = new mongoose.Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    message: {
        type: String,
        maxlength: 300,
    }
}, {
    timestamps: true
});

friendRequestSchema.index({ from: 1, to: 1 }, { unique: true }); // from và to là duy nhất, cố gửi lời mời đến cùng 1 người mongoDB báo lỗi 

friendRequestSchema.index({ from: 1 }); // truy vấn nhanh tất cả lời mời đã gửi

friendRequestSchema.index({ to: 1 }); // truy vấn nhanh tất cả lời mời đã nhận

const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);
export default FriendRequest
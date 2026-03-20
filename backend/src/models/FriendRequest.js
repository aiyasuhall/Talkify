import mongoose from "mongoose";

const friendRequestSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    message: {
      type: String,
      trim: true,
      maxlength: 300, // fallback limit theo ky tu
      validate: {
        validator(value) {
          if (!value) return true; // cho phep rong
          const words = value.trim().split(/\s+/).filter(Boolean);
          return words.length <= 40;
        },
        message: "A maximum of 40 words is allowed.",
      },
    },
  },
  {
    timestamps: true,
  }
);


friendRequestSchema.index({ from: 1, to: 1 }, { unique: true }); // from và to là duy nhất, cố gửi lời mời đến cùng 1 người mongoDB báo lỗi 

friendRequestSchema.index({ from: 1 }); // truy vấn nhanh tất cả lời mời đã gửi

friendRequestSchema.index({ to: 1 }); // truy vấn nhanh tất cả lời mời đã nhận

const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);
export default FriendRequest
import mongoose from "mongoose"

const friendSchema = mongoose.Schema({
    userA: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    userB: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
}, {
    timestamps: true
});

// Bỏ hẳn tham số (next) đi, chỉ dùng function() trống
friendSchema.pre("save", function () {
    const a = this.userA.toString();
    const b = this.userB.toString();

    if (a > b) {
        this.userA = new mongoose.Types.ObjectId(b);
        this.userB = new mongoose.Types.ObjectId(a);
    }
    //XÓA LUÔN LỆNH next() ở đây
    // Mongoose sẽ tự hiểu là hàm đã chạy xong và đi tiếp   
});

friendSchema.index({ userA: 1, userB: 1 }, { unique: true }); // tạo index độc nhất, không trùng tên

const Friend = mongoose.model("Friend", friendSchema);
export default Friend
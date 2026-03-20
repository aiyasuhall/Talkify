import { Server } from "socket.io"
import http from "http"
import express from "express"
import { socketAuthMiddleware } from "../middlewares/socketMiddleware.js";
import { getUserConversationsForSocketIO } from "../controllers/conversationController.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        credentials: true
    }
});

io.use(socketAuthMiddleware);

// { userId: { socketId, showOnlineStatus } }
const onlineUsers = new Map();

const broadcastOnlineUsers = () => {
    const visibleUsers = Array.from(onlineUsers.entries())
        .filter(([, data]) => data.showOnlineStatus)
        .map(([userId]) => userId);
    io.emit("online-users", visibleUsers);
};

io.on("connection", async (socket) => {
    const user = socket.user;
    console.log(`${user.displayName} online with socket ${socket.id}`);

    onlineUsers.set(user._id.toString(), {
        socketId: socket.id,
        showOnlineStatus: user.showOnlineStatus ?? true,
    });
    broadcastOnlineUsers();

    const conversationIds = await getUserConversationsForSocketIO(user._id);
    conversationIds.forEach((id) => {
        socket.join(id);
    });

    socket.on("join-conversation", (conversationId) => {
        socket.join(conversationId);
    });

    socket.join(user._id.toString());

    socket.on("toggle-online-status", (showOnlineStatus) => {
        const entry = onlineUsers.get(user._id.toString());
        if (entry) {
            onlineUsers.set(user._id.toString(), {
                ...entry,
                showOnlineStatus: !!showOnlineStatus,
            });
            broadcastOnlineUsers();
        }
    });

    socket.on("disconnect", () => {
        onlineUsers.delete(user._id.toString());
        broadcastOnlineUsers();
        console.log(`socket disconnected: ${socket.id}`);
    });
});

export { io, server, app };
import Friend from "../models/Friend.js";
import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import { io } from "../socket/index.js";

export const sendFriendRequest = async (req, res) => {
  try {
    const { to, message } = req.body;
    const from = req.user._id;

    if (!to) {
      return res.status(400).json({ message: "Recipient is required." });
    }

    if (from.toString() === to.toString()) {
      return res.status(400).json({ message: "Cannot send friend request to yourself." });
    }

    const normalizedMessage = (message || "").trim();
    const wordCount = normalizedMessage
      ? normalizedMessage.split(/\s+/).filter(Boolean).length
      : 0;

    if (wordCount > 40) {
      return res.status(400).json({ message: "A maximum of 40 words is allowed." });
    }

    const userExists = await User.exists({ _id: to });
    if (!userExists) {
      return res.status(404).json({ message: "User not found." });
    }

    const [meDoc, toDoc] = await Promise.all([
      User.findById(from).select("blockedUsers"),
      User.findById(to).select("blockedUsers"),
    ]);

    const iBlockedThem = meDoc?.blockedUsers?.some(
      (id) => id.toString() === to.toString()
    );
    const theyBlockedMe = toDoc?.blockedUsers?.some(
      (id) => id.toString() === from.toString()
    );

    if (iBlockedThem || theyBlockedMe) {
      return res
        .status(403)
        .json({ message: "Friend request is blocked between these users." });
    }

    let userA = from.toString();
    let userB = to.toString();
    if (userA > userB) {
      [userA, userB] = [userB, userA];
    }

    const [alreadyFriends, existingRequest] = await Promise.all([
      Friend.findOne({ userA, userB }),
      FriendRequest.findOne({
        $or: [{ from, to }, { from: to, to: from }],
      }),
    ]);

    if (alreadyFriends) {
      return res.status(400).json({ message: "You are already friends" });
    }

    if (existingRequest) {
      return res.status(400).json({ message: "Already having friend request." });
    }

    const request = await FriendRequest.create({
      from,
      to,
      message: normalizedMessage,
    });

    const populatedRequest = await FriendRequest.findById(request._id)
      .populate("from", "_id username displayName avatarUrl")
      .populate("to", "_id username displayName avatarUrl")
      .lean();

    io.to(to.toString()).emit("friend-request-received", {
      request: populatedRequest,
    });

    return res
      .status(201)
      .json({ message: "Sending friend request successfully.", request });
  } catch (error) {
    console.error("Error to send add friend request.", error);
    return res.status(500).json({ message: "System error." });
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Friend request not found." });
    }

    if (request.to.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You cannot accept this friend request." });
    }

    await Friend.create({
      userA: request.from,
      userB: request.to,
    });

    io.to(request.from.toString()).emit("friend-request-accepted", {
      requestId: request._id.toString(),
    });

    await FriendRequest.findByIdAndDelete(requestId);

    const from = await User.findById(request.from)
      .select("_id displayName avatarUrl")
      .lean();

    return res.status(200).json({
      message: "Accepted the friend request successfully.",
      newFriend: {
        _id: from?._id,
        displayName: from?.displayName,
        avatarUrl: from?.avatarUrl,
      },
    });
  } catch (error) {
    console.error("Error to accept friend request.", error);
    return res.status(500).json({ message: "System error." });
  }
};

export const declineFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: "Friend request not found." });
    }

    if (request.to.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You cannot accept this friend request." });
    }

    io.to(request.from.toString()).emit("friend-request-declined", {
      requestId: request._id.toString(),
    });

    await FriendRequest.findByIdAndDelete(requestId);

    return res.sendStatus(204);
  } catch (error) {
    console.error("Error to decline friend request.", error);
    return res.status(500).json({ message: "System error." });
  }
};

export const getAllFriends = async (req, res) => {
  try {
    const userId = req.user._id;

    const friendships = await Friend.find({
      $or: [{ userA: userId }, { userB: userId }],
    })
      .populate("userA", "_id displayName avatarUrl username")
      .populate("userB", "_id displayName avatarUrl username")
      .lean();

    if (!friendships.length) {
      return res.status(200).json({ friends: [] });
    }

    const friends = friendships.map((f) =>
      f.userA._id.toString() === userId.toString() ? f.userB : f.userA
    );

    return res.status(200).json({ friends });
  } catch (error) {
    console.error("Error to get friends list.", error);
    return res.status(500).json({ message: "System error." });
  }
};

export const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const populateFields = "_id username displayName avatarUrl";

    const [sent, received] = await Promise.all([
      FriendRequest.find({ from: userId }).populate("to", populateFields),
      FriendRequest.find({ to: userId }).populate("from", populateFields),
    ]);

    return res.status(200).json({ sent, received });
  } catch (error) {
    console.error("Error to get friends request list.", error);
    return res.status(500).json({ message: "System error." });
  }
};
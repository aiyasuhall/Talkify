import express from "express"
import { createConversation, getConversation, getMessages, markAsSeen, renameConversation, deleteConversation } from "../controllers/conversationController.js"
import { checkFriendship } from "../middlewares/friendMiddleware.js"

const router = express.Router();

router.post("/", checkFriendship, createConversation);

router.get("/", getConversation);

router.get("/:conversationId/messages", getMessages);

router.patch("/:conversationId/seen", markAsSeen);

router.patch("/:conversationId/rename", renameConversation);

router.delete("/:conversationId/delete", deleteConversation);

export default router
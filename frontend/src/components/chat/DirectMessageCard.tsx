import type { Conversation } from '@/types/chat'
import ChatCard from './ChatCard'
import { useAuthStore } from '@/stores/useAuthStore'
import { useChatStore } from '@/stores/useChatStore';
import {cn} from "@/lib/utils"
import UserAvatar from './UserAvatar';
import StatusBadge from './StatusBadge';
import UnreadCountBadge from './UnreadCountBadge';
import { useSocketStore } from '@/stores/useSocketStore';

const DirectMessageCard = ({ convo }: { convo: Conversation }) => {
  const { user } = useAuthStore();
  const { activeConversationId, setActiveConversation, messages, fetchMessages, renameConversation, deleteConversation } = useChatStore();
  const { onlineUsers } = useSocketStore();

  if (!user) return null;

  const otherUser = convo.participants.find((p) => p._id !== user._id);
  if (!otherUser) return null;

  const displayChatName = convo.nicknames?.[otherUser._id] || otherUser.displayName || "";

  const unreadCount = convo.unreadCounts[user._id];
  const contentText = convo.lastMessage?.content?.trim() ?? "";
  const hasPhoto = Boolean(convo.lastMessage?.imgUrl);

  const rawSenderId =
    (convo.lastMessage as any)?.sender?._id ||
    (typeof (convo.lastMessage as any)?.senderId === "string"
      ? (convo.lastMessage as any).senderId
      : (convo.lastMessage as any)?.senderId?._id) ||
    "";

  const senderDisplayName =
    (convo.lastMessage as any)?.sender?.displayName ||
    convo.participants.find((p) => p._id === rawSenderId)?.displayName ||
    "";

  const senderName =
    rawSenderId === user._id
      ? "You"
      : (convo.nicknames?.[rawSenderId] || senderDisplayName || displayChatName);

  const lastMessage = contentText || (hasPhoto ? `${senderName} sent a photo` : "");

  const handleSelectConversation = async (id: string) => {
    setActiveConversation(id);
    if (!messages[id]) {
      await fetchMessages();
    }
  };

  return (
    <ChatCard
      convoId={convo._id}
      name={displayChatName}
      timestamp={
        convo.lastMessage?.createdAt ? new Date(convo.lastMessage.createdAt) : undefined}
      isActive={activeConversationId === convo._id}
      onSelect={handleSelectConversation}
      unreadCount={unreadCount}
      chatType="direct"
      onRename={(newName) => renameConversation(convo._id, newName, otherUser._id)}
      onDelete={() => deleteConversation(convo._id)}
      leftSection={
        <>
          <UserAvatar
            type="sidebar"
            name={otherUser.displayName ?? ""}
            avatarUrl={otherUser.avatarUrl ?? undefined}
          />
          <StatusBadge status={onlineUsers.includes(otherUser?._id ?? "") ? "online" : "offline"} />
          {
            unreadCount > 0 && <UnreadCountBadge unreadCount={unreadCount}/>
          }
        </>
      }
      subtitle={
        <p className={cn("text-sm truncate",
          unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground"
        )}>
          {lastMessage}
        </p>
      }
    />
  )
}

export default DirectMessageCard
import { useAuthStore } from '@/stores/useAuthStore'
import { useChatStore } from '@/stores/useChatStore';
import type { Conversation } from '@/types/chat'
import ChatCard from './ChatCard';
import UnreadCountBadge from './UnreadCountBadge';
import GroupChatAvatar from './GroupChatAvatar';
import { cn } from "@/lib/utils";

const GroupChatCard = ({ convo }: { convo: Conversation }) => {
  const { user } = useAuthStore();
  const { activeConversationId, setActiveConversation, messages, fetchMessages, renameConversation, deleteConversation } = useChatStore();

  if (!user) return null;

  const unreadCount = convo.unreadCounts[user._id];
  const name = convo.group?.name ?? "";

  const last = convo.lastMessage as any;

  const senderId =
    last?.sender?._id ||
    (typeof last?.senderId === "string" ? last.senderId : last?.senderId?._id) ||
    "";

  const senderDisplayName =
    last?.sender?.displayName ||
    convo.participants.find((p) => p._id === senderId)?.displayName ||
    "";

  const senderName = senderId
    ? (convo.nicknames?.[senderId] || senderDisplayName || "Someone")
    : "Someone";

  const contentText = last?.content?.trim?.() ?? "";
  const hasPhoto = Boolean(last?.imgUrl);
  const lastMessageText = contentText || (hasPhoto ? `${senderName} sent a photo` : "");
  
  const handleSelectConversation = async (id: string) => {
    setActiveConversation(id);

    if (!messages[id]) {
      await fetchMessages();
    }
  };

  return (
    <ChatCard
      convoId={convo._id}
      name={name}
      timestamp={
        convo.lastMessage?.createdAt ? new Date(convo.lastMessage.createdAt) : undefined
      }
      isActive={activeConversationId === convo._id}
      onSelect={handleSelectConversation}
      unreadCount={unreadCount}
      chatType="group"
      onRename={(newName) => renameConversation(convo._id, newName)} // Không cần targetUserId vì là group
      onDelete={() => deleteConversation(convo._id)}
      leftSection={
        <>
          {unreadCount > 0 && <UnreadCountBadge unreadCount={unreadCount} />}
          <GroupChatAvatar
            participants={convo.participants}
            type="chat"
          />
        </>
      }
      subtitle={
      <p
        className={cn(
          "text-sm truncate",
          unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground"
        )}
      >
        {lastMessageText || `${convo.participants.length} Members`}
      </p>
    }
    
    />
  )
}

export default GroupChatCard
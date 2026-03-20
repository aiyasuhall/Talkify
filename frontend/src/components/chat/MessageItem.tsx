import { cn, formatMessageTime } from "@/lib/utils";
import type { Conversation, Message, Participant } from "@/types/chat"
import UserAvatar from "./UserAvatar";
import { Card } from "../ui/card";
import { Badge } from '@/components/ui/badge'

interface MessageItemProps {
    message: Message;
    index: number;
    messages: Message[];
    selectedConvo: Conversation;
    lastMessageStatus: "delivered" | "seen"
}

const MessageItem = ({ message, index, messages, selectedConvo, lastMessageStatus }: MessageItemProps) => {
    // Trong mảng reversedMessages (đã đảo ngược), index + 1 chính là tin nhắn CŨ HƠN (gửi trước đó)
    const prev = index + 1 < messages.length ? messages[index + 1] : undefined;
    
    // Logic 5 phút: 
    // 1. Nếu không có tin nhắn cũ hơn (!prev) -> Bắt buộc hiện giờ (đây là tin nhắn đầu tiên của mảng)
    // 2. Nếu có, lấy (thời gian tin hiện tại - thời gian tin cũ hơn) xem có > 5 phút (300000ms) không
    const isShowTime = !prev || 
        new Date(message.createdAt).getTime() - new Date(prev.createdAt).getTime() > 300000;
    
    // Tách nhóm nếu có hiển thị thời gian, HOẶC nếu người gửi tin này khác với người gửi tin trước đó
    const isGroupBreak = isShowTime || message.senderId !== prev?.senderId;

    const participant = selectedConvo.participants.find((p: Participant) => p._id.toString() === message.senderId.toString());

    return (
    // FIX QUAN TRỌNG: Thay thẻ Fragment (<></>) bằng thẻ <div> để flex-col-reverse của cha không đảo lộn vị trí Time và Message
    <div className="flex flex-col w-full">
      {/* time */}
      {isShowTime && (
        <span className="flex justify-center text-xs text-muted-foreground px-1 mb-2 mt-4">
          {formatMessageTime(new Date(message.createdAt))}
        </span>
      )}

      <div
        className={cn(
          "flex gap-2 message-bounce mt-1",
          message.isOwn ? "justify-end" : "justify-start"
        )}
      >
        {/* avatar */}
        {!message.isOwn && (
          <div className="w-8">
            {isGroupBreak && (
              <UserAvatar
                type="chat"
                name={participant?.displayName ?? "Moji"}
                avatarUrl={participant?.avatarUrl ?? undefined}
              />
            )}
          </div>
        )}

        {/* tin nhắn */}
        <div
          className={cn(
            "max-w-xs lg:max-w-md space-y-1 flex flex-col",
            message.isOwn ? "items-end" : "items-start"
          )}
        >
          <Card
            className={cn(
              "p-3",
              message.isOwn ? "chat-bubble-sent border-0" : "chat-bubble-received"
            )}
          >
            {message.imgUrl && (
              <img
                src={message.imgUrl}
                alt="attachment"
                className="max-w-xs rounded-md object-cover mb-1"
              />
            )}
            {message.content && (
              <p className="text-sm leading-relaxed break-words">{message.content}</p>
            )}
          </Card>

          {/* seen/ delivered */}
          {message.isOwn && message._id === selectedConvo.lastMessage?._id && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs px-1.5 py-0.5 h-4 border-0",
                lastMessageStatus === "seen"
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {lastMessageStatus}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;